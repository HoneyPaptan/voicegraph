import { Workflow, WorkflowNode, WorkflowEdge } from './types';

/**
 * Ensures workflow has proper sequential edges connecting all nodes
 * If edges are missing or incomplete, generates them automatically
 * @param workflow - The workflow to validate and fix
 * @returns Workflow with complete edge connections
 */
export function ensureWorkflowEdges(workflow: Workflow): Workflow {
  if (!workflow.nodes || workflow.nodes.length === 0) {
    return workflow;
  }

  // Sort nodes by ID to ensure correct order (step-0, step-1, step-2, etc.)
  const sortedNodes = [...workflow.nodes].sort((a, b) => {
    const aNum = parseInt(a.id.replace('step-', ''));
    const bNum = parseInt(b.id.replace('step-', ''));
    return aNum - bNum;
  });

  // Check if workflow already has edges
  if (workflow.edges && workflow.edges.length > 0) {
    console.log(`✓ Workflow already has ${workflow.edges.length} edges, keeping them`);
    return {
      ...workflow,
      nodes: sortedNodes,
      edges: workflow.edges,
    };
  }

  // Generate sequential edges only if no edges exist
  const edges: WorkflowEdge[] = [];
  
  for (let i = 0; i < sortedNodes.length - 1; i++) {
    edges.push({
      id: `edge-${i}`,
      source: sortedNodes[i].id,
      target: sortedNodes[i + 1].id,
    });
  }

  console.log(`✓ Generated ${edges.length} sequential edges for ${sortedNodes.length} nodes`);

  return {
    ...workflow,
    nodes: sortedNodes,
    edges,
  };
}

/**
 * Validates and repairs workflow structure
 * - Ensures all nodes have required fields
 * - Generates missing edges
 * - Fixes node IDs if needed
 */
export function validateWorkflow(workflow: any): Workflow {
  // Ensure nodes array exists
  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    throw new Error('Invalid workflow: missing nodes array');
  }

  // Validate each node
  workflow.nodes.forEach((node: any, index: number) => {
    if (!node.id) {
      node.id = `step-${index}`;
    }
    if (!node.type) {
      throw new Error(`Node ${node.id} missing type`);
    }
    if (!node.action) {
      throw new Error(`Node ${node.id} missing action`);
    }
    if (!node.label) {
      node.label = `${node.type.toUpperCase()} - ${node.action}`;
    }
  });

  // Ensure edges or generate them
  const validatedWorkflow = ensureWorkflowEdges(workflow as Workflow);

  return validatedWorkflow;
}

