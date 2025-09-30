import { NextResponse } from 'next/server';
import { analyzeParallelWorkflow } from '@/lib/parallel-executor';
import { WorkflowNode, WorkflowEdge } from '@/lib/types';

/**
 * GET /api/test-parallel
 * Test endpoint to verify parallel workflow detection
 */
export async function GET() {
  // Test Case 1: Sequential Workflow
  const sequentialNodes: WorkflowNode[] = [
    { id: 'step-0', type: 'notion', action: 'fetch_page', label: 'Fetch' },
    { id: 'step-1', type: 'llm', action: 'summarize', label: 'Summarize' },
    { id: 'step-2', type: 'email', action: 'send', label: 'Email' },
  ];
  
  const sequentialEdges: WorkflowEdge[] = [
    { id: 'edge-0', source: 'step-0', target: 'step-1' },
    { id: 'edge-1', source: 'step-1', target: 'step-2' },
  ];

  // Test Case 2: Parallel Workflow (fan-out then fan-in)
  const parallelNodes: WorkflowNode[] = [
    { id: 'step-0', type: 'notion', action: 'fetch_page', label: 'Fetch' },
    { id: 'step-1', type: 'llm', action: 'summarize', label: 'Summarize' },
    { id: 'step-2', type: 'llm', action: 'extract_date', label: 'Extract Date' },
    { id: 'step-3', type: 'email', action: 'send', label: 'Email' },
  ];
  
  const parallelEdges: WorkflowEdge[] = [
    { id: 'edge-0', source: 'step-0', target: 'step-1' }, // Fetch → Summarize
    { id: 'edge-1', source: 'step-0', target: 'step-2' }, // Fetch → Extract (parallel!)
    { id: 'edge-2', source: 'step-1', target: 'step-3' }, // Summarize → Email
    { id: 'edge-3', source: 'step-2', target: 'step-3' }, // Extract → Email
  ];

  // Test Case 3: Fully Parallel (no edges between parallel nodes)
  const fullyParallelNodes: WorkflowNode[] = [
    { id: 'step-0', type: 'notion', action: 'fetch_page', label: 'Fetch Page 1' },
    { id: 'step-1', type: 'notion', action: 'fetch_page', label: 'Fetch Page 2' },
    { id: 'step-2', type: 'email', action: 'send', label: 'Email' },
  ];
  
  const fullyParallelEdges: WorkflowEdge[] = [
    { id: 'edge-0', source: 'step-0', target: 'step-2' },
    { id: 'edge-1', source: 'step-1', target: 'step-2' },
  ];

  // Analyze all test cases
  const sequentialLayers = analyzeParallelWorkflow(sequentialNodes, sequentialEdges);
  const parallelLayers = analyzeParallelWorkflow(parallelNodes, parallelEdges);
  const fullyParallelLayers = analyzeParallelWorkflow(fullyParallelNodes, fullyParallelEdges);

  return NextResponse.json({
    testResults: {
      sequential: {
        nodes: sequentialNodes.length,
        edges: sequentialEdges.length,
        layers: sequentialLayers.length,
        layerDetails: sequentialLayers.map(l => ({
          layer: l.layer,
          nodeCount: l.nodes.length,
          nodes: l.nodes.map(n => n.label),
          isParallel: l.nodes.length > 1,
        })),
        expected: 'All sequential (3 layers, 1 node each)',
      },
      parallel: {
        nodes: parallelNodes.length,
        edges: parallelEdges.length,
        layers: parallelLayers.length,
        layerDetails: parallelLayers.map(l => ({
          layer: l.layer,
          nodeCount: l.nodes.length,
          nodes: l.nodes.map(n => n.label),
          isParallel: l.nodes.length > 1,
        })),
        expected: 'Layer 1 should have 2 nodes in parallel',
      },
      fullyParallel: {
        nodes: fullyParallelNodes.length,
        edges: fullyParallelEdges.length,
        layers: fullyParallelLayers.length,
        layerDetails: fullyParallelLayers.map(l => ({
          layer: l.layer,
          nodeCount: l.nodes.length,
          nodes: l.nodes.map(n => n.label),
          isParallel: l.nodes.length > 1,
        })),
        expected: 'Layer 0 should have 2 nodes in parallel',
      },
    },
    message: 'Check console for layer analysis logs',
  });
}

