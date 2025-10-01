'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  Position,
  MarkerType,
  Handle,
  NodeChange,
  applyNodeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { WorkflowNode as WFNode, WorkflowEdge } from '@/lib/types';
import { Database, Sparkles, Mail } from 'lucide-react';
import { analyzeParallelWorkflow, calculateParallelPositions } from '@/lib/parallel-executor';

interface WorkflowCanvasProps {
  nodes: WFNode[];
  edges: WorkflowEdge[];
  activeNodeId?: string | null;
  onNodePositionUpdate?: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeDelete?: (nodeId: string) => void;
  isInteractive?: boolean;
}

/**
 * Custom node component with animations and icons
 */
function CustomNode({ data, id }: { data: any; id: string }) {
  const getIcon = () => {
    switch (data.type) {
      case 'notion':
        return <Database className="w-5 h-5" />;
      case 'llm':
        return <Sparkles className="w-5 h-5" />;
      case 'email':
        return <Mail className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (data.type) {
      case 'notion':
        return 'from-blue-500 to-blue-600';
      case 'llm':
        return 'from-purple-500 to-purple-600';
      case 'email':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const isActive = data.isActive;
  const isError = data.isError;
  const isParallel = data.isParallel;
  const isInteractive = data.isInteractive;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: data.delay }}
      className={`
        px-4 py-3 rounded-lg shadow-lg bg-gradient-to-br ${getColor()}
        text-white min-w-[180px] border-2 relative
        ${isActive ? 'border-yellow-400 ring-4 ring-yellow-400/50 animate-pulse' : ''}
        ${isError ? 'border-red-500 ring-4 ring-red-500/50' : ''}
        ${!isActive && !isError ? 'border-white/20' : ''}
        ${isInteractive ? 'hover:ring-2 hover:ring-white/50 cursor-move' : ''}
      `}
    >
      {/* Parallel indicator badge */}
      {isParallel && (
        <div className="absolute -top-2 -right-2 bg-cyan-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-lg">
          ⚡
        </div>
      )}
      
      {/* Delete button - only show if interactive */}
      {isInteractive && data.onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete(id);
          }}
          className="absolute -top-2 -left-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg transition-colors group"
          title="Delete node"
        >
          <span className="text-sm font-bold group-hover:scale-110 transition-transform">×</span>
        </button>
      )}

      {/* Input Handle - Connection point for incoming edges */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-white border-2 border-gray-400"
      />
      
      <div className="flex items-center gap-2">
        {getIcon()}
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      <div className="text-xs opacity-80 mt-1">{data.action}</div>
      
      {/* Output Handle - Connection point for outgoing edges */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-white border-2 border-gray-400"
      />
    </motion.div>
  );
}

/**
 * Node types - defined outside component to prevent re-creation
 * This is a React Flow best practice for performance
 */
const nodeTypes = {
  custom: CustomNode,
};

/**
 * WorkflowCanvas - Visualizes workflow as an animated graph
 */
export function WorkflowCanvas({ 
  nodes, 
  edges, 
  activeNodeId,
  onNodePositionUpdate,
  onNodeDelete,
  isInteractive = false,
}: WorkflowCanvasProps) {
  // MUST call all hooks before any conditional returns!
  
  // Local state for React Flow nodes (allows dragging to work)
  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  
  // Handle node deletion
  const handleNodeDelete = (nodeId: string) => {
    if (onNodeDelete) {
      onNodeDelete(nodeId);
    }
  };
  
  // Handle React Flow node changes (for dragging)
  const handleNodesChange = (changes: NodeChange[]) => {
    if (!isInteractive) return;
    
    setRfNodes((nds) => applyNodeChanges(changes, nds));
    
    // Update parent component with new positions as user drags
    changes.forEach((change) => {
      if (change.type === 'position' && change.position) {
        if (onNodePositionUpdate) {
          onNodePositionUpdate(change.id, change.position);
        }
      }
    });
  };
  
  // Convert workflow nodes to React Flow nodes with smart parallel positioning
  const flowNodes: Node[] = useMemo(() => {
    if (nodes.length === 0) return [];
    
    // Analyze parallel structure
    const layers = analyzeParallelWorkflow(nodes, edges);
    
    const verticalSpacing = 180;
    const canvasWidth = 800;
    
    // Create nodes with parallel-aware positioning
    const nodeMap = new Map<string, Node>();
    
    layers.forEach((layer, layerIndex) => {
      // Calculate horizontal positions for nodes in this layer
      const xPositions = calculateParallelPositions(layer.nodes, canvasWidth);
      const yPosition = layerIndex * verticalSpacing + 50;
      
      layer.nodes.forEach((node) => {
        // Use saved position if exists, otherwise calculate
        const xPosition = node.position?.x ?? (xPositions.get(node.id) || canvasWidth / 2);
        const yPos = node.position?.y ?? yPosition;
        
        nodeMap.set(node.id, {
          id: node.id,
          type: 'custom',
          position: { 
            x: xPosition, 
            y: yPos
          },
          data: {
            label: node.label || node.type.toUpperCase(),
            type: node.type,
            action: node.action,
            delay: layerIndex * 0.2,
            isActive: node.id === activeNodeId,
            isError: false,
            isParallel: layer.nodes.length > 1,
            parallelCount: layer.nodes.length,
            isInteractive: isInteractive,
            onDelete: isInteractive ? handleNodeDelete : undefined,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
          draggable: isInteractive,
        });
      });
    });
    
    // Return nodes in original order for consistent rendering
    return nodes.map(node => nodeMap.get(node.id)!).filter(Boolean);
  }, [nodes, edges, activeNodeId, isInteractive]);
  
  // Update local state when flowNodes change
  useEffect(() => {
    setRfNodes(flowNodes);
  }, [flowNodes]);

  // Convert workflow edges to React Flow edges with beautiful styling
  const flowEdges: Edge[] = useMemo(() => {
    if (!edges || edges.length === 0) {
      return [];
    }

    return edges.map((edge, index) => ({
      id: edge.id || `edge-${index}`,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: true,
      style: { 
        stroke: '#8b5cf6',
        strokeWidth: 3,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#8b5cf6',
      },
    }));
  }, [edges]);

  // NOW check for empty state after all hooks
  if (nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No workflow yet. Record a voice command to begin!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={rfNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        nodesDraggable={isInteractive}
        nodesConnectable={false}
        elementsSelectable={isInteractive}
        zoomOnScroll={!isInteractive}
        panOnDrag={!isInteractive}
      >
        <Background color="#334155" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

