import { WorkflowNode, WorkflowEdge, ExecutionContext } from './types';

/**
 * Represents a layer of nodes that can execute in parallel
 */
export interface ExecutionLayer {
  layer: number;
  nodes: WorkflowNode[];
  dependencies: string[]; // IDs of nodes that must complete before this layer
}

/**
 * Analyzes workflow structure and groups nodes into parallel execution layers
 * Nodes in the same layer have no dependencies on each other and can run concurrently
 * 
 * @param nodes - All workflow nodes
 * @param edges - Workflow edges defining dependencies
 * @returns Array of execution layers in order
 */
export function analyzeParallelWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ExecutionLayer[] {
  // Build dependency map: nodeId -> [nodeIds that depend on it]
  const dependencyMap = new Map<string, string[]>();
  const incomingEdges = new Map<string, string[]>();
  
  // Initialize maps
  nodes.forEach(node => {
    dependencyMap.set(node.id, []);
    incomingEdges.set(node.id, []);
  });
  
  // Populate dependency information
  edges.forEach(edge => {
    const sources = incomingEdges.get(edge.target) || [];
    sources.push(edge.source);
    incomingEdges.set(edge.target, sources);
    
    const targets = dependencyMap.get(edge.source) || [];
    targets.push(edge.target);
    dependencyMap.set(edge.source, targets);
  });
  
  // Build execution layers using topological sort
  const layers: ExecutionLayer[] = [];
  const processed = new Set<string>();
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  let currentLayer = 0;
  
  while (processed.size < nodes.length) {
    // Find all nodes whose dependencies are satisfied
    const layerNodes: WorkflowNode[] = [];
    const layerDependencies = new Set<string>();
    
    for (const node of nodes) {
      if (processed.has(node.id)) continue;
      
      const deps = incomingEdges.get(node.id) || [];
      const allDepsProcessed = deps.every(depId => processed.has(depId));
      
      if (allDepsProcessed) {
        layerNodes.push(node);
        deps.forEach(dep => layerDependencies.add(dep));
      }
    }
    
    if (layerNodes.length === 0) {
      // Circular dependency or error
      console.error('⚠️ Circular dependency detected or invalid workflow structure');
      break;
    }
    
    layers.push({
      layer: currentLayer,
      nodes: layerNodes,
      dependencies: Array.from(layerDependencies),
    });
    
    layerNodes.forEach(node => processed.add(node.id));
    currentLayer++;
  }
  
  console.log(`🔀 Parallel execution plan: ${layers.length} layers`);
  layers.forEach((layer, idx) => {
    console.log(`  Layer ${idx}: ${layer.nodes.length} node(s) - ${layer.nodes.map(n => n.label || n.id).join(', ')}`);
  });
  
  return layers;
}

/**
 * Calculates optimal X positions for nodes in a layer for side-by-side display
 * @param layerNodes - Nodes in the current layer
 * @param canvasWidth - Width of the canvas
 * @returns Map of nodeId to X position
 */
export function calculateParallelPositions(
  layerNodes: WorkflowNode[],
  canvasWidth: number = 800
): Map<string, number> {
  const positions = new Map<string, number>();
  const nodeCount = layerNodes.length;
  
  if (nodeCount === 1) {
    // Single node: center it
    positions.set(layerNodes[0].id, canvasWidth / 2);
  } else {
    // Multiple nodes: distribute horizontally
    const spacing = Math.min(300, canvasWidth / (nodeCount + 1));
    const startX = (canvasWidth - (spacing * (nodeCount - 1))) / 2;
    
    layerNodes.forEach((node, index) => {
      positions.set(node.id, startX + (index * spacing));
    });
  }
  
  return positions;
}

/**
 * Checks if a workflow has parallel branches
 * @param nodes - Workflow nodes
 * @param edges - Workflow edges
 * @returns True if workflow contains parallel execution paths
 */
export function hasParallelBranches(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): boolean {
  const layers = analyzeParallelWorkflow(nodes, edges);
  return layers.some(layer => layer.nodes.length > 1);
}

/**
 * Gets all nodes that can execute concurrently (same layer, no dependencies)
 * @param nodeId - The reference node ID
 * @param nodes - All workflow nodes
 * @param edges - Workflow edges
 * @returns Array of node IDs that are parallel to the given node
 */
export function getParallelNodes(
  nodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): string[] {
  const layers = analyzeParallelWorkflow(nodes, edges);
  const nodeLayer = layers.find(layer => 
    layer.nodes.some(n => n.id === nodeId)
  );
  
  if (!nodeLayer || nodeLayer.nodes.length === 1) {
    return [];
  }
  
  return nodeLayer.nodes
    .filter(n => n.id !== nodeId)
    .map(n => n.id);
}

