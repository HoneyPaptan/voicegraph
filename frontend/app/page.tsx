'use client';

import { useState, useEffect } from 'react';
import { VoiceInput } from '@/components/VoiceInput';
import { FloatingMicButton } from '@/components/FloatingMicButton';
import { WorkflowCanvas } from '@/components/WorkflowCanvas';
import { ExecutionLogs } from '@/components/ExecutionLogs';
import { ConfigModal } from '@/components/ConfigModal';
import { WorkflowHistory } from '@/components/WorkflowHistory';
import { NodesLibrary } from '@/components/NodesLibrary';
import { NodeConfigPanel } from '@/components/NodeConfigPanel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Workflow, ExecutionLog, WorkflowNode } from '@/lib/types';
import { WorkflowRun } from '@/lib/workflow-history';
import { Sparkles, Play, RefreshCw, Loader2, Mic, Zap, Link2 } from 'lucide-react';

export default function Home() {
  // State management
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isParsingWorkflow, setIsParsingWorkflow] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [activeNodeIds, setActiveNodeIds] = useState<string[]>([]);
  const [errorNodeId, setErrorNodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStartTime, setExecutionStartTime] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditingWorkflow, setIsEditingWorkflow] = useState(false);
  const [useBackgroundExecution, setUseBackgroundExecution] = useState(false);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [selectedNodeForConfig, setSelectedNodeForConfig] = useState<WorkflowNode | null>(null);

  // Poll current workflow status if running in background
  useEffect(() => {
    if (!currentWorkflowId || !useBackgroundExecution) return;
    
    let hasCompleted = false; // Track if workflow has reached terminal state
    
    const pollWorkflowStatus = async () => {
      // Don't poll if already completed/failed
      if (hasCompleted) return;
      
      try {
        const response = await fetch('/api/workflow-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflowId: currentWorkflowId }),
        });
        
        const data = await response.json();
        
        if (data.success && data.run) {
          // Update logs
          setExecutionLogs(data.run.logs);
          
          // Update status based on workflow state
          if (data.run.status === 'completed') {
            hasCompleted = true; // Mark as completed
            setIsExecuting(false);
            setActiveNodeIds([]);
            setErrorNodeId(null);
            setExecutionStartTime(null);
            console.log('✅ Background workflow completed - stopping poll');
            // Stop polling on completion
            setCurrentWorkflowId(null);
            
            // Add a final completion log to ensure clean state
            const completionLog: ExecutionLog = {
              nodeId: 'system',
              type: 'success', 
              message: '✅ Background workflow completed successfully',
              timestamp: Date.now(),
            };
            setExecutionLogs((prev) => [...prev, completionLog]);
          } else if (data.run.status === 'failed') {
            hasCompleted = true; // Mark as failed
            setIsExecuting(false);
            setActiveNodeIds([]);
            setExecutionStartTime(null);
            const errorLog = data.run.logs.find((log: any) => log.type === 'error');
            if (errorLog) {
              setErrorNodeId(errorLog.nodeId);
            }
            console.log('❌ Background workflow failed - stopping poll');
            // Stop polling on failure
            setCurrentWorkflowId(null);
          } else if (data.run.status === 'running') {
            setIsExecuting(true);
            
            // Find all nodes currently executing (have progress but no success yet)
            const progressLogs = data.run.logs.filter((log: any) => log.type === 'progress');
            const successLogs = data.run.logs.filter((log: any) => log.type === 'success');
            
            // Get unique node IDs that have progress but no success yet
            const activeNodes = progressLogs
              .map((log: any) => log.nodeId)
              .filter((nodeId: string) => 
                !successLogs.some((successLog: any) => successLog.nodeId === nodeId)
              )
              .filter((value: string, index: number, self: string[]) => 
                self.indexOf(value) === index // Remove duplicates
              );
            
            setActiveNodeIds(activeNodes);
          }
        }
      } catch (error) {
        console.error('Failed to poll workflow status:', error);
      }
    };
    
    // Initial fetch
    pollWorkflowStatus();
    
    // Poll every second while workflow is active
    const interval = setInterval(pollWorkflowStatus, 1000);
    
    return () => {
      clearInterval(interval);
      hasCompleted = false; // Reset on cleanup
    };
  }, [currentWorkflowId, useBackgroundExecution]);

  // Handle transcription
  const handleTranscribed = async (text: string) => {
    setTranscribedText(text);
    setParseError(null);
    
    // Validate transcribed text
    const trimmedText = text.trim();
    if (!trimmedText || trimmedText.length < 3 || /^[.\s,!?-]*$/.test(trimmedText)) {
      setParseError('No meaningful voice input detected. Please speak clearly and try again.');
      return;
    }
    
    if (isEditMode && workflow) {
      // Edit existing workflow
      await editWorkflow(text);
    } else {
      // Create new workflow
      await parseWorkflow(text);
    }
  };

  // Parse workflow from text
  const parseWorkflow = async (text: string) => {
    try {
      setIsParsingWorkflow(true);
      setParseError(null);

      const response = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse workflow');
      }

      setWorkflow(data.workflow);
      setIsEditMode(false); // Exit edit mode after creating new workflow
    } catch (error: any) {
      console.error('Parse error:', error);
      setParseError(error.message);
    } finally {
      setIsParsingWorkflow(false);
    }
  };

  // Edit existing workflow with voice
  const editWorkflow = async (text: string) => {
    try {
      setIsEditingWorkflow(true);
      setParseError(null);

      const response = await fetch('/api/edit-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          currentWorkflow: workflow 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to edit workflow');
      }

      // Analyze what changed
      const oldNodeCount = workflow?.nodes.length || 0;
      const newNodeCount = data.workflow.nodes.length;
      const nodeCountChange = newNodeCount - oldNodeCount;
      
      let changeMessage = '';
      if (nodeCountChange > 0) {
        changeMessage = `Added ${nodeCountChange} new node${nodeCountChange > 1 ? 's' : ''}`;
      } else if (nodeCountChange < 0) {
        changeMessage = `Removed ${Math.abs(nodeCountChange)} node${Math.abs(nodeCountChange) > 1 ? 's' : ''}`;
      } else {
        changeMessage = 'Modified existing nodes';
      }

      setWorkflow(data.workflow);
      
      // Show detailed success message
      setExecutionLogs((prev) => [
        ...prev,
        {
          nodeId: 'system',
          type: 'success',
          message: `✅ Workflow edited successfully - ${changeMessage}`,
          timestamp: Date.now(),
        },
        {
          nodeId: 'system',
          type: 'info',
          message: `🎤 Voice command: "${text}"`,
          timestamp: Date.now(),
        },
      ]);

      console.log('📝 Workflow edit completed:', {
        command: text,
        oldNodes: oldNodeCount,
        newNodes: newNodeCount,
        change: changeMessage
      });

    } catch (error: any) {
      console.error('Edit error:', error);
      setParseError(error.message);
      
      // Add error to execution logs for better visibility
      setExecutionLogs((prev) => [
        ...prev,
        {
          nodeId: 'system',
          type: 'error',
          message: `❌ Voice edit failed: ${error.message}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsEditingWorkflow(false);
    }
  };

  // Start workflow execution
  const handleRunWorkflow = () => {
    setShowConfigModal(true);
  };

  // Execute workflow in background (Inngest)
  const executeWorkflowBackground = async (config: Record<string, string>) => {
    if (!workflow) return;

    setIsExecuting(true);
    setExecutionLogs([]);
    setActiveNodeIds([]);
    setErrorNodeId(null);

    try {
      const response = await fetch('/api/execute-inngest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow,
          config,
          transcribedText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start background execution');
      }

      // Store workflow ID for tracking
      setCurrentWorkflowId(data.workflowId);
      setExecutionStartTime(Date.now());

      // Show success message
      setExecutionLogs([
        {
          nodeId: 'system',
          type: 'success',
          message: `✓ Workflow started in background (ID: ${data.workflowId.slice(0, 12)}...)`,
          timestamp: Date.now(),
        },
        {
          nodeId: 'system',
          type: 'info',
          message: '📊 View progress in Workflow History',
          timestamp: Date.now(),
        },
      ]);
    } catch (error: any) {
      console.error('Background execution error:', error);
      setExecutionLogs([
        {
          nodeId: 'system',
          type: 'error',
          message: `✗ ${error.message}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  // Restore workflow from history
  const handleRestoreWorkflow = (run: WorkflowRun) => {
    console.log('Restoring workflow:', run.id);
    
    // Restore workflow state
    setWorkflow(run.workflow);
    setTranscribedText(run.transcribedText || '');
    setExecutionLogs(run.logs);
    setCurrentWorkflowId(run.id);
    
    // Set active/error nodes based on status
    if (run.status === 'running') {
      setIsExecuting(true);
      const lastLog = run.logs[run.logs.length - 1];
      if (lastLog && lastLog.type === 'progress') {
        setActiveNodeIds([lastLog.nodeId]);
      }
    } else if (run.status === 'failed') {
      setIsExecuting(false);
      const errorLog = run.logs.find((log) => log.type === 'error');
      if (errorLog) {
        setErrorNodeId(errorLog.nodeId);
      }
      setActiveNodeIds([]);
    } else if (run.status === 'completed') {
      setIsExecuting(false);
      setActiveNodeIds([]);
      setErrorNodeId(null);
    }
    
    // Clear edit mode
    setIsEditMode(false);
    setParseError(null);
  };

  // Execute workflow with config
  const executeWorkflow = async (config: Record<string, string>) => {
    if (!workflow) return;

    // Use background execution if enabled
    if (useBackgroundExecution) {
      return executeWorkflowBackground(config);
    }

    // Reset all states
    setIsExecuting(true);
    setExecutionLogs([]);
    setActiveNodeIds([]);
    setErrorNodeId(null);
    setExecutionStartTime(Date.now());

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: workflow.nodes,
          edges: workflow.edges,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start execution');
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Stream ended - always stop loading
          console.log('SSE stream ended, stopping execution');
          setIsExecuting(false);
          setActiveNodeIds([]);
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              // Add log entry
              const log: ExecutionLog = {
                nodeId: data.nodeId || 'system',
                type: data.type,
                message: data.message,
                timestamp: data.timestamp,
              };
              
              setExecutionLogs((prev) => [...prev, log]);

              // Handle different event types
              if (data.type === 'progress') {
                // Add node to active list if not already there
                setActiveNodeIds(prev => {
                  if (!prev.includes(data.nodeId)) {
                    return [...prev, data.nodeId];
                  }
                  return prev;
                });
                setErrorNodeId(null);
              } else if (data.type === 'success') {
                // Remove completed node from active list
                setActiveNodeIds(prev => prev.filter(id => id !== data.nodeId));
              } else if (data.type === 'error') {
                // Error occurred - stop everything immediately
                console.log('Error detected, stopping execution');
                setErrorNodeId(data.nodeId);
                setActiveNodeIds([]);
                setIsExecuting(false);
              } else if (data.type === 'complete') {
                // Workflow completed successfully
                console.log('Workflow completed successfully');
                setActiveNodeIds([]);
                setIsExecuting(false);
                setErrorNodeId(null);
                
                // Add a final completion log to ensure clean state
                const completionLog: ExecutionLog = {
                  nodeId: 'system',
                  type: 'success',
                  message: '✅ All workflows completed successfully',
                  timestamp: Date.now(),
                };
                setExecutionLogs((prev) => [...prev, completionLog]);
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Execution error:', error);
      setExecutionLogs((prev) => [
        ...prev,
        {
          nodeId: 'system',
          type: 'error',
          message: `Execution failed: ${error.message}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      // Always stop loading, no matter what
      console.log('Finally block - ensuring execution is stopped');
      setIsExecuting(false);
      setActiveNodeIds([]);
    }
  };

  // Handle node position save when drag is complete (optimized for smooth dragging)
  const handleNodeDragStop = (nodeId: string, position: { x: number; y: number }) => {
    console.log('💾 Saving final position for node:', nodeId, position);
    
    if (!workflow) return;
    
    // Update the workflow with final position after drag completes
    const updatedNodes = workflow.nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          position: position,
        };
      }
      return node;
    });
    
    setWorkflow({
      ...workflow,
      nodes: updatedNodes,
    });
  };

  // Handle node deletion
  const handleNodeDelete = (nodeId: string) => {
    if (!workflow) return;
    
    console.log('🗑️ Deleting node:', nodeId);
    
    // Remove node from workflow
    const updatedNodes = workflow.nodes.filter(n => n.id !== nodeId);
    
    // Remove edges connected to this node
    const updatedEdges = workflow.edges.filter(
      e => e.source !== nodeId && e.target !== nodeId
    );
    
    setWorkflow({
      ...workflow,
      nodes: updatedNodes,
      edges: updatedEdges,
    });
  };

  // Handle adding a new node manually
  const handleAddNode = (type: string, action: string) => {
    if (!workflow) {
      // Create new workflow if none exists
      const newNode: WorkflowNode = {
        id: `node-${Date.now()}`,
        type: type as any,
        action,
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} - ${action}`,
        params: {},
        position: { x: 400, y: 200 },
      };
      
      setWorkflow({
        workflowId: `workflow-${Date.now()}`,
        nodes: [newNode],
        edges: [],
      });
      
      console.log('✅ Created new workflow with node:', newNode);
      return;
    }
    
    // Add to existing workflow
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type: type as any,
      action,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} - ${action}`,
      params: {},
      position: { x: 400, y: workflow.nodes.length * 150 + 100 },
    };
    
    setWorkflow({
      ...workflow,
      nodes: [...workflow.nodes, newNode],
    });
    
    console.log('✅ Added new node:', newNode);
  };

  // Handle edge connection
  const handleEdgeConnect = (source: string, target: string) => {
    if (!workflow) return;
    
    console.log('🔗 Connecting edge:', source, '→', target);
    
    const newEdge = {
      id: `edge-${source}-${target}`,
      source,
      target,
    };
    
    setWorkflow({
      ...workflow,
      edges: [...workflow.edges, newEdge],
    });
  };

  // Handle edge deletion
  const handleEdgeDelete = (edgeId: string) => {
    if (!workflow) return;
    
    console.log('🗑️ Deleting edge:', edgeId);
    
    setWorkflow({
      ...workflow,
      edges: workflow.edges.filter(e => e.id !== edgeId),
    });
  };

  // Toggle manual mode
  const toggleManualMode = () => {
    setManualMode(!manualMode);
    if (!manualMode) {
      console.log('🔧 Manual mode enabled - You can now connect nodes manually');
    }
  };

  // Handle node click to open config
  const handleNodeClick = (nodeId: string) => {
    if (!workflow) return;
    
    const node = workflow.nodes.find(n => n.id === nodeId);
    if (node) {
      console.log('⚙️ Opening config for node:', node);
      setSelectedNodeForConfig(node);
    }
  };

  // Save node configuration
  const handleSaveNodeConfig = (nodeId: string, params: Record<string, any>) => {
    if (!workflow) return;
    
    console.log('💾 Saving config for node:', nodeId, params);
    
    const updatedNodes = workflow.nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          params,
        };
      }
      return node;
    });
    
    setWorkflow({
      ...workflow,
      nodes: updatedNodes,
    });
    
    setSelectedNodeForConfig(null);
  };

  // Reset workflow
  const handleReset = () => {
    setTranscribedText('');
    setWorkflow(null);
    setParseError(null);
    setExecutionLogs([]);
    setActiveNodeIds([]);
    setErrorNodeId(null);
    setIsExecuting(false);
    setExecutionStartTime(null);
    setIsEditMode(false);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    setTranscribedText('');
    setParseError(null);
  };

  // Load example workflow
  const loadExample = async (exampleText: string) => {
    setTranscribedText(exampleText);
    await parseWorkflow(exampleText);
  };

  // Calculate execution time
  const executionTime = executionStartTime
    ? ((Date.now() - executionStartTime) / 1000).toFixed(2)
    : null;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-950 text-white">
      {/* Full-Screen Workflow Canvas Background */}
      <div className="absolute inset-0 w-full h-full">
        <WorkflowCanvas
          nodes={workflow?.nodes || []}
          edges={workflow?.edges || []}
          activeNodeIds={activeNodeIds}
          errorNodeId={errorNodeId}
          onNodeDragStop={handleNodeDragStop}
          onNodeDelete={handleNodeDelete}
          onNodeClick={handleNodeClick}
          onEdgeConnect={handleEdgeConnect}
          onEdgeDelete={handleEdgeDelete}
          isInteractive={!isExecuting && !isEditMode}
          allowConnections={manualMode}
        />
      </div>

      {/* Floating UI Elements */}
      <div className="relative z-10 pointer-events-none">
        {/* Top Header - Floating */}
        <div className="absolute top-6 left-6 pointer-events-auto">
          <Card className="px-4 py-3 bg-gray-900/90 border-gray-700 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <div>
                <h1 className="text-lg font-bold">AI Workflow Orchestrator</h1>
                <p className="text-xs text-gray-400">Voice-powered automation</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Center Floating Mic Button - Only show when NO workflow */}
        {!workflow && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-auto z-30">
            <div className="flex flex-col items-center gap-8 max-w-4xl px-6">
              <FloatingMicButton onTranscribed={handleTranscribed} />
              
              {(isParsingWorkflow || isEditingWorkflow) && (
                <div className="flex items-center gap-3 text-blue-400 bg-gray-900/90 backdrop-blur-md px-6 py-3 rounded-xl border border-blue-600/50 shadow-2xl">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Parsing with Cerebras AI...</span>
                </div>
              )}

              {transcribedText && !isParsingWorkflow && (
                <Card className="p-5 bg-gray-900/90 border-gray-700 backdrop-blur-md shadow-2xl w-full">
                  <h3 className="text-sm font-semibold mb-2 text-gray-300">Transcribed</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{transcribedText}</p>
                </Card>
              )}

              {parseError && (
                <Card className="p-5 bg-red-900/90 border-red-700 backdrop-blur-md shadow-2xl w-full">
                  <h3 className="text-sm font-semibold mb-2 text-red-400">Error</h3>
                  <p className="text-red-300 text-sm mb-3">{parseError}</p>
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full"
                    onClick={() => parseWorkflow(transcribedText)}
                  >
                    Retry
                  </Button>
                </Card>
              )}

              {/* Quick Templates & Manual Mode - Show if no transcription or error */}
              {!transcribedText && !parseError && !isParsingWorkflow && (
                <div className="w-full space-y-6">
                  {/* Templates Section */}
                  <div>
                    <p className="text-center text-gray-400 text-sm mb-4">or choose a template</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
                      <Button
                        variant="outline"
                        className="h-auto py-4 px-5 bg-gray-900/50 hover:bg-gray-800/70 border-gray-700 hover:border-purple-600 transition-all"
                        onClick={() => loadExample('Get my Notion meeting notes and email me a summary')}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-sm mb-1">Meeting Notes Summary</div>
                          <div className="text-xs text-gray-400">Notion → Summarize → Email</div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 px-5 bg-gray-900/50 hover:bg-gray-800/70 border-gray-700 hover:border-purple-600 transition-all"
                        onClick={() => loadExample('Fetch my Notion project tasks and send me a status update')}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-sm mb-1">Project Status Update</div>
                          <div className="text-xs text-gray-400">Notion → Analyze → Email</div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 px-5 bg-gray-900/50 hover:bg-gray-800/70 border-gray-700 hover:border-purple-600 transition-all"
                        onClick={() => loadExample('Get my weekly Notion journal and email me key insights')}
                      >
                        <div className="text-center">
                          <div className="font-semibold text-sm mb-1">Weekly Insights</div>
                          <div className="text-xs text-gray-400">Notion → Extract Insights → Email</div>
                        </div>
                      </Button>
                    </div>
                  </div>

                  {/* Manual Mode Option */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-px bg-gray-700 w-full max-w-xs"></div>
                    <Button
                      onClick={() => {
                        setManualMode(true);
                        // Create empty workflow to enable manual mode
                        setWorkflow({
                          workflowId: `workflow-${Date.now()}`,
                          nodes: [],
                          edges: [],
                        });
                      }}
                      variant="outline"
                      className="gap-2 px-6 py-3 bg-blue-600/20 hover:bg-blue-600/30 border-blue-600 hover:border-blue-500 text-blue-300 hover:text-blue-200 transition-all"
                    >
                      <Link2 className="w-4 h-4" />
                      Start Manual Workflow
                    </Button>
                    <p className="text-xs text-gray-500 text-center max-w-xs">
                      Build your workflow by manually adding and connecting nodes
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Left Side - Voice Input & Templates - Only show when workflow EXISTS */}
        {workflow && (
          <div className="absolute top-32 left-6 w-80 space-y-4 pointer-events-auto">
          {/* Voice Input Card */}
          <Card className="p-4 bg-gray-900/90 border-gray-700 backdrop-blur-md shadow-2xl">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Mic className="w-4 h-4" />
              {isEditMode ? 'Edit Workflow' : 'Voice Input'}
            </h2>
            <VoiceInput onTranscribed={handleTranscribed} isEditMode={isEditMode} />
            
            {(isParsingWorkflow || isEditingWorkflow) && (
              <div className="mt-3 flex items-center justify-center gap-2 text-blue-400 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" />
                {isEditingWorkflow ? 'Updating...' : 'Parsing with Cerebras AI...'}
              </div>
            )}
          </Card>

          {/* Quick Examples Card */}
          <Card className="p-4 bg-gray-900/90 border-gray-700 backdrop-blur-md shadow-2xl">
            <h2 className="text-sm font-semibold mb-3">Quick Templates</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-2 px-3 bg-gray-800/50 hover:bg-gray-700/50 border-gray-600"
                onClick={() => loadExample('Get my Notion meeting notes and email me a summary')}
              >
                <div>
                  <div className="font-medium text-xs">Meeting Notes Summary</div>
                  <div className="text-[10px] text-gray-400">Notion → Summarize → Email</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-2 px-3 bg-gray-800/50 hover:bg-gray-700/50 border-gray-600"
                onClick={() => loadExample('Fetch my Notion project tasks and send me a status update')}
              >
                <div>
                  <div className="font-medium text-xs">Project Status Update</div>
                  <div className="text-[10px] text-gray-400">Notion → Analyze → Email</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-2 px-3 bg-gray-800/50 hover:bg-gray-700/50 border-gray-600"
                onClick={() => loadExample('Get my weekly Notion journal and email me key insights')}
              >
                <div>
                  <div className="font-medium text-xs">Weekly Insights</div>
                  <div className="text-[10px] text-gray-400">Notion → Extract Insights → Email</div>
                </div>
              </Button>
            </div>
          </Card>

          {/* Parse Error Card */}
          {parseError && (
            <Card className="p-4 bg-red-900/90 border-red-700 backdrop-blur-md shadow-2xl">
              <h2 className="text-sm font-semibold mb-2 text-red-400">Parse Error</h2>
              <p className="text-red-300 text-xs mb-3">{parseError}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => parseWorkflow(transcribedText)}
              >
                Retry
              </Button>
            </Card>
          )}
          </div>
        )}

        {/* Right Side - Transcribed Text & Execution Logs */}
        <div className="absolute top-6 right-6 w-96 space-y-4 pointer-events-auto max-h-[calc(100vh-180px)] overflow-y-auto pb-32">
          {/* Transcribed Text Card */}
          {transcribedText && (
            <Card className="p-4 bg-gray-900/90 border-gray-700 backdrop-blur-md shadow-2xl">
              <h2 className="text-sm font-semibold mb-2">Transcribed Text</h2>
              <p className="text-gray-300 text-xs leading-relaxed">{transcribedText}</p>
            </Card>
          )}

          {/* Execution Logs */}
          {executionLogs.length > 0 && (
            <Card className="p-4 bg-gray-900/90 border-gray-700 backdrop-blur-md shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">Execution Logs</h2>
                {executionTime && !isExecuting && (
                  <span className="text-xs text-green-400">
                    {executionTime}s
                  </span>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto pr-2">
                <ExecutionLogs logs={executionLogs} />
              </div>
            </Card>
          )}
        </div>

        {/* Bottom Left - Reset Button */}
        {workflow && (
          <div className="fixed bottom-6 left-6 pointer-events-auto z-30">
            <Button 
              variant="outline" 
              onClick={handleReset} 
              className="gap-2 bg-gray-900/95 backdrop-blur-md border-gray-700 hover:bg-red-600/90 hover:border-red-600 shadow-2xl"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        )}

        {/* Bottom Center - Workflow Controls - Always visible when workflow exists */}
        {workflow && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto z-30 w-auto">
            <Card className="px-4 py-3 bg-gray-900/95 border-2 border-gray-700 backdrop-blur-lg shadow-2xl rounded-2xl">
              {/* Main Controls Row */}
              <div className="flex items-center gap-3">
                {/* Run Workflow Button - Primary Action */}
                {!isExecuting ? (
                  <Button
                    onClick={handleRunWorkflow}
                    size="lg"
                    className="gap-2 bg-green-600 hover:bg-green-700 font-semibold px-6 shadow-lg"
                    disabled={isEditMode}
                  >
                    <Play className="w-5 h-5" />
                    Run Workflow
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-600/20 rounded-lg border-2 border-blue-600 shadow-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    <span className="text-sm text-blue-400 font-semibold">Executing...</span>
                  </div>
                )}

                {/* Separator */}
                <div className="h-10 w-px bg-gray-600"></div>
                
                <Button
                  onClick={toggleEditMode}
                  variant={isEditMode ? "default" : "outline"}
                  size="default"
                  className={`gap-2 ${isEditMode ? 'bg-purple-600 hover:bg-purple-700 border-purple-600' : 'border-gray-600 hover:border-purple-500'}`}
                  disabled={manualMode}
                >
                  <Mic className="w-4 h-4" />
                  {isEditMode ? '🎤 Voice Edit Active' : 'Voice Edit'}
                </Button>

                <Button
                  onClick={toggleManualMode}
                  variant={manualMode ? "default" : "outline"}
                  size="default"
                  className={`gap-2 ${manualMode ? 'bg-blue-600 hover:bg-blue-700 border-blue-600' : 'border-gray-600 hover:border-blue-500'}`}
                  disabled={isEditMode}
                >
                  <Link2 className="w-4 h-4" />
                  {manualMode ? '🔗 Manual Mode' : 'Manual Mode'}
                </Button>

                {/* Separator */}
                <div className="h-10 w-px bg-gray-600"></div>

                {/* Background Execution Toggle */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/70 rounded-lg border border-gray-600">
                  <Zap className={`w-4 h-4 ${useBackgroundExecution ? 'text-yellow-400' : 'text-gray-500'}`} />
                  <span className="text-xs font-medium text-gray-300">Background</span>
                  <Button
                    size="sm"
                    variant={useBackgroundExecution ? "default" : "outline"}
                    onClick={() => setUseBackgroundExecution(!useBackgroundExecution)}
                    className={`h-6 text-xs px-3 font-medium ${useBackgroundExecution ? 'bg-yellow-600 hover:bg-yellow-700 border-yellow-600' : 'border-gray-600'}`}
                  >
                    {useBackgroundExecution ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </div>

              {/* Compact Mode Hints */}
              {(isEditMode || manualMode) && (
                <div className="mt-2 pt-2 border-t border-gray-700/50">
                  {isEditMode && (
                    <div className="text-center">
                      <p className="text-[11px] text-purple-300">
                        <strong>🎤 Voice Edit Mode:</strong> Record to add, remove, or modify nodes
                      </p>
                    </div>
                  )}
                  
                  {manualMode && (
                    <div className="text-center">
                      <p className="text-[11px] text-blue-300">
                        <strong>🔗 Manual Mode:</strong> Click "Nodes Library" to add nodes • Drag from handles to connect
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Voice Edit Tips - Show when in edit mode */}
        {workflow && isEditMode && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 pointer-events-auto z-20 max-w-2xl">
            <Card className="p-3 bg-purple-900/90 border-purple-600/50 backdrop-blur-md shadow-2xl">
              <div className="text-center">
                <p className="text-xs text-purple-200 font-medium mb-1">💡 Voice Edit Examples:</p>
                <div className="flex flex-wrap gap-2 justify-center text-[10px] text-purple-300">
                  <span>"Remove the email step"</span>
                  <span>•</span>
                  <span>"Add a Slack notification after summarize"</span>
                  <span>•</span>
                  <span>"Replace the last node with GitHub integration"</span>
                  <span>•</span>
                  <span>"Add analysis in parallel to summarize"</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Nodes Library - Shows when manual mode is enabled or always available */}
      {manualMode && <NodesLibrary onAddNode={handleAddNode} />}
      
      {/* Node Configuration Panel */}
      <NodeConfigPanel
        node={selectedNodeForConfig}
        onClose={() => setSelectedNodeForConfig(null)}
        onSave={handleSaveNodeConfig}
      />

      {/* Config Modal */}
      {workflow && (
        <ConfigModal
          open={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          onSubmit={executeWorkflow}
          workflowNodes={workflow.nodes}
        />
      )}

      {/* Workflow History - Already Floating */}
      <WorkflowHistory onRestore={handleRestoreWorkflow} />
    </div>
  );
}
