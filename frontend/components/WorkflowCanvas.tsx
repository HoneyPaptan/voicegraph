'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  Position,
  MarkerType,
  Handle,
  NodeChange,
  EdgeChange,
  Connection,
  ConnectionLineType,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { WorkflowNode as WFNode, WorkflowEdge } from '@/lib/types';
import { Database, Sparkles, Mail, Search, Github, FileEdit, Upload, FileText, FileSpreadsheet, FileImage, Settings } from 'lucide-react';
import { analyzeParallelWorkflow, calculateParallelPositions } from '@/lib/parallel-executor';

interface WorkflowCanvasProps {
  nodes: WFNode[];
  edges: WorkflowEdge[];
  activeNodeIds?: string[];
  errorNodeId?: string | null;
  onNodeDragStop?: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeDelete?: (nodeId: string) => void;
  onNodeClick?: (nodeId: string) => void;
  onEdgeConnect?: (source: string, target: string) => void;
  onEdgeDelete?: (edgeId: string) => void;
  isInteractive?: boolean;
  allowConnections?: boolean;
  onError?: (message: string) => void;
}

/**
 * Custom node component with animations and icons
 */
function CustomNode({ data, id }: { data: any; id: string }) {
  const getIcon = () => {
    switch (data.type) {
      case 'notion':
        return <Database className="w-5 h-5" />;
      case 'notion_create':
        return <FileEdit className="w-5 h-5" />;
      case 'llm':
        return <Sparkles className="w-5 h-5" />;
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'tavily':
      case 'web_search':
        return <Search className="w-5 h-5" />;
      case 'github':
        return <Github className="w-5 h-5" />;
      case 'file_upload':
        return <Upload className="w-5 h-5" />;
      case 'csv_upload':
        return <FileSpreadsheet className="w-5 h-5" />;
      case 'pdf_upload':
        return <FileImage className="w-5 h-5" />;
      case 'txt_upload':
        return <FileText className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (data.type) {
      case 'notion':
        return 'from-blue-500 to-blue-600';
      case 'notion_create':
        return 'from-blue-600 to-indigo-600';
      case 'llm':
        return 'from-blue-500 to-blue-600';
      case 'email':
        return 'from-green-500 to-green-600';
      case 'tavily':
      case 'web_search':
        return 'from-orange-500 to-orange-600';
      case 'github':
        return 'from-gray-700 to-gray-800';
      case 'file_upload':
        return 'from-indigo-500 to-indigo-600';
      case 'csv_upload':
        return 'from-green-500 to-green-600';
      case 'pdf_upload':
        return 'from-red-500 to-red-600';
      case 'txt_upload':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const isActive = data.isActive;
  const isError = data.isError;
  const isParallel = data.isParallel;
  const isInteractive = data.isInteractive;
  const hasConfig = data.hasConfig;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: data.delay }}
      className={`
        px-4 py-3 rounded-lg shadow-lg bg-gradient-to-br ${getColor()}
        text-white min-w-[180px] border-2 relative group
        ${isActive ? 'border-yellow-400 ring-4 ring-yellow-400/50 animate-pulse' : ''}
        ${isError ? 'border-red-500 ring-4 ring-red-500/50' : ''}
        ${!isActive && !isError ? 'border-white/20' : ''}
        ${isInteractive ? 'hover:ring-2 hover:ring-white/50 cursor-move' : ''}
      `}
    >
      
      {/* Configure button - shows on hover */}
      {hasConfig && data.onConfigure && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onConfigure(id);
          }}
          className="absolute -top-2 -right-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
          title="Configure node"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      )}
      
      {/* Delete button - only show if interactive */}
      {isInteractive && data.onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete(id);
          }}
          className="absolute -top-2 -left-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg transition-colors opacity-0 group-hover:opacity-100 z-10"
          title="Delete node"
        >
          <span className="text-sm font-bold">×</span>
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
 * Custom edge with a small delete button rendered at the midpoint
 */
function RemovableEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, data }: any) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{ stroke: '#8b5cf6', strokeWidth: 3 }} markerEnd={markerEnd} />
      {data?.isInteractive && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="group"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                data?.onDeleteEdge?.(id);
              }}
              title="Remove connection"
              className="w-5 h-5 rounded-full bg-red-600 text-white text-xs leading-none flex items-center justify-center shadow-md opacity-80 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const edgeTypes = {
  removable: RemovableEdge,
};

/**
 * WorkflowCanvas - Visualizes workflow as an animated graph
 */
export function WorkflowCanvas({ 
  nodes, 
  edges, 
  activeNodeIds = [],
  errorNodeId,
  onNodeDragStop,
  onNodeDelete,
  onNodeClick,
  onEdgeConnect,
  onEdgeDelete,
  isInteractive = false,
  allowConnections = false,
  onError,
}: WorkflowCanvasProps) {
  // MUST call all hooks before any conditional returns!
  
  // Local state for React Flow nodes and edges (allows smooth interactions)
  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);
  
  // Handle node deletion - memoized for performance
  const handleNodeDelete = useCallback((nodeId: string) => {
    if (onNodeDelete) {
      onNodeDelete(nodeId);
    }
  }, [onNodeDelete]);

  // Handle node configuration - memoized for performance
  const handleNodeConfigure = useCallback((nodeId: string) => {
    console.log('⚙️ Opening configuration for node:', nodeId);
    if (onNodeClick) {
      onNodeClick(nodeId);
    }
  }, [onNodeClick]);
  
  // Handle React Flow node changes (for dragging) - No state updates during drag
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    // Apply changes to local state only (smooth dragging)
    setRfNodes((nds) => applyNodeChanges(changes, nds));
  }, []);
  
  // Save position only when drag is complete (no lag!) - memoized
  const handleNodeDragStop = useCallback((_event: any, node: Node) => {
    console.log('📍 Drag complete, saving position for:', node.id, node.position);
    if (onNodeDragStop && node.position) {
      onNodeDragStop(node.id, node.position);
    }
  }, [onNodeDragStop]);

  // Handle edge changes (for manual connections)
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    setRfEdges((eds) => applyEdgeChanges(changes, eds));
    
    // Handle edge deletions
    changes.forEach((change) => {
      if (change.type === 'remove' && onEdgeDelete) {
        onEdgeDelete(change.id);
      }
    });
  }, [onEdgeDelete]);

  // Handle new edge connections
  const handleConnect = useCallback((connection: Connection) => {
    console.log('🔗 New connection:', connection);
    
    if (!connection.source || !connection.target) return;
    // Prevent circular/self connections
    if (connection.source === connection.target) {
      if (onError) onError('No circular node connections are allowed.');
      return;
    }
    // Prevent duplicate edges
    const exists = (rfEdges as Edge[]).some((e) => e.source === connection.source && e.target === connection.target);
    if (exists) {
      if (onError) onError('This connection already exists.');
      return;
    }
    
    // Add edge to local state immediately for smooth UX
    setRfEdges((eds) => addEdge({
      ...connection,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#8b5cf6', strokeWidth: 3 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#8b5cf6',
      },
    }, eds));
    
    // Notify parent component
    if (onEdgeConnect) {
      onEdgeConnect(connection.source, connection.target);
    }
  }, [onEdgeConnect, onError, rfEdges]);
  
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
            isActive: activeNodeIds.includes(node.id),
            isError: node.id === errorNodeId,
            isParallel: layer.nodes.length > 1,
            parallelCount: layer.nodes.length,
            isInteractive: isInteractive,
            hasConfig: true, // All nodes can be configured
            onDelete: isInteractive ? handleNodeDelete : undefined,
            onConfigure: handleNodeConfigure,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
          draggable: isInteractive,
        });
      });
    });
    
    // Return nodes in original order for consistent rendering
    return nodes.map(node => nodeMap.get(node.id)!).filter(Boolean);
  }, [nodes, edges, activeNodeIds, errorNodeId, isInteractive]);
  
  // Convert workflow edges to React Flow edges with beautiful styling
  const flowEdges: Edge[] = useMemo(() => {
    if (!edges || edges.length === 0) {
      return [];
    }

    return edges.map((edge, index) => ({
      id: edge.id || `edge-${index}`,
      source: edge.source,
      target: edge.target,
      type: 'removable',
      animated: true,
      style: { 
        stroke: '#8b5cf6',
        strokeWidth: 3,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#8b5cf6',
      },
      data: {
        isInteractive,
        onDeleteEdge: (edgeId: string) => {
          setRfEdges((current) => current.filter((e) => e.id !== edgeId));
          if (onEdgeDelete) onEdgeDelete(edgeId);
        },
      },
    }));
  }, [edges, isInteractive, onEdgeDelete]);

  // Update local state when flowNodes change
  useEffect(() => {
    setRfNodes(flowNodes);
  }, [flowNodes]);

  // Update local edges when flowEdges change
  useEffect(() => {
    setRfEdges(flowEdges);
  }, [flowEdges]);

  // NOW check for empty state after all hooks
  if (nodes.length === 0) {
    return (
      <div className="h-full w-full bg-gray-950">
        {/* Clean empty state - no overlay text */}
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-950">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeDragStop={handleNodeDragStop}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        nodesDraggable={true}
        nodesConnectable={allowConnections}
        elementsSelectable={true}
        zoomOnScroll={true}
        panOnDrag={true}
        // Performance optimizations
        proOptions={{ hideAttribution: true }}
        deleteKeyCode="Delete"
        // Connection styling
        connectionLineStyle={{ stroke: '#8b5cf6', strokeWidth: 3 }}
        connectionLineType={ConnectionLineType.SmoothStep}
      >
        <Background color="#1f2937" gap={20} size={1} />
        <Controls className="bg-gray-900/90 border-gray-700" />
      </ReactFlow>
      
      {/* Connection Instructions Overlay */}
      {allowConnections && rfNodes.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-blue-600/90 backdrop-blur-md px-4 py-2 rounded-lg shadow-lg border border-blue-500">
            <p className="text-xs text-white font-medium">
              🔗 Drag from node handles to create connections
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

