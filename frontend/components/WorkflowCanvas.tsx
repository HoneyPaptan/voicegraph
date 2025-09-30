'use client';

import { useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  Position,
  MarkerType,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { WorkflowNode as WFNode } from '@/lib/types';
import { Database, Sparkles, Mail } from 'lucide-react';

interface WorkflowCanvasProps {
  nodes: WFNode[];
  edges: any[];
  activeNodeId?: string | null;
}

/**
 * Custom node component with animations and icons
 */
function CustomNode({ data }: { data: any }) {
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: data.delay }}
      className={`
        px-4 py-3 rounded-lg shadow-lg bg-gradient-to-br ${getColor()}
        text-white min-w-[180px] border-2
        ${isActive ? 'border-yellow-400 ring-4 ring-yellow-400/50 animate-pulse' : ''}
        ${isError ? 'border-red-500 ring-4 ring-red-500/50' : ''}
        ${!isActive && !isError ? 'border-white/20' : ''}
      `}
    >
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

const nodeTypes = {
  custom: CustomNode,
};

/**
 * WorkflowCanvas - Visualizes workflow as an animated graph
 */
export function WorkflowCanvas({ nodes, edges, activeNodeId }: WorkflowCanvasProps) {
  // MUST call all hooks before any conditional returns!
  
  // Convert workflow nodes to React Flow nodes with smart positioning
  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((node, index) => {
      // Calculate position for vertical flow with proper spacing
      const verticalSpacing = 180;
      const horizontalCenter = 250;
      
      return {
        id: node.id,
        type: 'custom',
        position: { 
          x: horizontalCenter, 
          y: index * verticalSpacing + 50 
        },
        data: {
          label: node.label || node.type.toUpperCase(),
          type: node.type,
          action: node.action,
          delay: index * 0.2,
          isActive: node.id === activeNodeId,
          isError: false,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
    });
  }, [nodes, activeNodeId]);

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
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background color="#334155" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

