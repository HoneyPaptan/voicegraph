'use client';

import { useState, useEffect } from 'react';
import { VoiceInput } from '@/components/VoiceInput';
import { WorkflowCanvas } from '@/components/WorkflowCanvas';
import { ExecutionLogs } from '@/components/ExecutionLogs';
import { ConfigModal } from '@/components/ConfigModal';
import { WorkflowHistory } from '@/components/WorkflowHistory';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Workflow, ExecutionLog } from '@/lib/types';
import { WorkflowRun } from '@/lib/workflow-history';
import { Sparkles, Play, RefreshCw, Loader2, Mic, Zap } from 'lucide-react';

export default function Home() {
  // State management
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isParsingWorkflow, setIsParsingWorkflow] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [errorNodeId, setErrorNodeId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStartTime, setExecutionStartTime] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditingWorkflow, setIsEditingWorkflow] = useState(false);
  const [useBackgroundExecution, setUseBackgroundExecution] = useState(false);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [isNodeManipulationMode, setIsNodeManipulationMode] = useState(false);
  const [tempNodePositions, setTempNodePositions] = useState<Record<string, { x: number; y: number }>>({});

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
            setActiveNodeId(null);
            setErrorNodeId(null);
            setExecutionStartTime(null);
            console.log('✅ Background workflow completed - stopping poll');
            // Stop polling on completion
            setCurrentWorkflowId(null);
          } else if (data.run.status === 'failed') {
            hasCompleted = true; // Mark as failed
            setIsExecuting(false);
            setActiveNodeId(null);
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
            
            // Find the last progress log to show which node is currently executing
            const progressLogs = data.run.logs.filter((log: any) => log.type === 'progress');
            const successLogs = data.run.logs.filter((log: any) => log.type === 'success');
            
            if (progressLogs.length > 0) {
              const lastProgress = progressLogs[progressLogs.length - 1];
              // Only show as active if this node doesn't have a success log yet
              const hasSuccessLog = successLogs.some((log: any) => log.nodeId === lastProgress.nodeId);
              
              if (!hasSuccessLog) {
                setActiveNodeId(lastProgress.nodeId);
              } else {
                setActiveNodeId(null);
              }
            } else {
              setActiveNodeId(null);
            }
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

      setWorkflow(data.workflow);
      
      // Show success message
      setExecutionLogs((prev) => [
        ...prev,
        {
          nodeId: 'system',
          type: 'info',
          message: `✓ ${data.message || 'Workflow updated'}`,
          timestamp: Date.now(),
        },
      ]);
    } catch (error: any) {
      console.error('Edit error:', error);
      setParseError(error.message);
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
    setActiveNodeId(null);
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
        setActiveNodeId(lastLog.nodeId);
      }
    } else if (run.status === 'failed') {
      setIsExecuting(false);
      const errorLog = run.logs.find((log) => log.type === 'error');
      if (errorLog) {
        setErrorNodeId(errorLog.nodeId);
      }
      setActiveNodeId(null);
    } else if (run.status === 'completed') {
      setIsExecuting(false);
      setActiveNodeId(null);
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
    setActiveNodeId(null);
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
          setActiveNodeId(null);
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
                setActiveNodeId(data.nodeId);
                setErrorNodeId(null);
              } else if (data.type === 'success') {
                setActiveNodeId(null);
              } else if (data.type === 'error') {
                // Error occurred - stop everything immediately
                console.log('Error detected, stopping execution');
                setErrorNodeId(data.nodeId);
                setActiveNodeId(null);
                setIsExecuting(false);
              } else if (data.type === 'complete') {
                // Workflow completed successfully
                console.log('Workflow completed successfully');
                setActiveNodeId(null);
                setIsExecuting(false);
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
      setActiveNodeId(null);
    }
  };

  // Handle node position updates during drag
  const handleNodePositionUpdate = (nodeId: string, position: { x: number; y: number }) => {
    console.log('📍 Updating position for node:', nodeId, position);
    setTempNodePositions(prev => ({
      ...prev,
      [nodeId]: position,
    }));
  };

  // Save all node positions when exiting edit mode
  const saveNodePositions = () => {
    if (!workflow || Object.keys(tempNodePositions).length === 0) return;
    
    console.log('💾 Saving all node positions:', tempNodePositions);
    
    const updatedNodes = workflow.nodes.map(node => {
      if (tempNodePositions[node.id]) {
        return {
          ...node,
          position: tempNodePositions[node.id],
        };
      }
      return node;
    });
    
    setWorkflow({
      ...workflow,
      nodes: updatedNodes,
    });
    
    // Clear temp positions
    setTempNodePositions({});
  };

  // Toggle node manipulation mode
  const toggleNodeManipulationMode = () => {
    if (isNodeManipulationMode) {
      // Exiting edit mode - save positions
      saveNodePositions();
    }
    setIsNodeManipulationMode(!isNodeManipulationMode);
    if (isEditMode) setIsEditMode(false);
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

  // Reset workflow
  const handleReset = () => {
    setTranscribedText('');
    setWorkflow(null);
    setParseError(null);
    setExecutionLogs([]);
    setActiveNodeId(null);
    setErrorNodeId(null);
    setIsExecuting(false);
    setExecutionStartTime(null);
    setIsEditMode(false);
    setIsNodeManipulationMode(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-500" />
              <div>
                <h1 className="text-2xl font-bold">AI Workflow Orchestrator</h1>
                <p className="text-sm text-gray-400">Voice-powered automation with Cerebras AI</p>
              </div>
            </div>
            {workflow && (
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Input & Controls */}
          <div className="space-y-6">
            {/* Voice Input */}
            <Card className="p-6 bg-gray-900/50 border-gray-800">
              <h2 className="text-lg font-semibold mb-4">
                {isEditMode ? 'Edit Workflow' : 'Voice Input'}
              </h2>
              <VoiceInput onTranscribed={handleTranscribed} isEditMode={isEditMode} />
              
              {(isParsingWorkflow || isEditingWorkflow) && (
                <div className="mt-4 flex items-center justify-center gap-2 text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEditingWorkflow ? 'Updating workflow...' : 'Parsing workflow with Cerebras AI...'}
                </div>
              )}
            </Card>

            {/* Example Workflows */}
            <Card className="p-6 bg-gray-900/50 border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Quick Examples</h2>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => loadExample('Get my Notion meeting notes and email me a summary')}
                >
                  <div>
                    <div className="font-semibold text-sm">Meeting Notes Summary</div>
                    <div className="text-xs text-gray-400">Notion → Summarize → Email</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => loadExample('Fetch my Notion project tasks and send me a status update')}
                >
                  <div>
                    <div className="font-semibold text-sm">Project Status Update</div>
                    <div className="text-xs text-gray-400">Notion → Analyze → Email</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => loadExample('Get my weekly Notion journal and email me key insights')}
                >
                  <div>
                    <div className="font-semibold text-sm">Weekly Insights</div>
                    <div className="text-xs text-gray-400">Notion → Extract Insights → Email</div>
                  </div>
                </Button>
              </div>
            </Card>

            {/* Transcribed Text */}
            {transcribedText && (
              <Card className="p-6 bg-gray-900/50 border-gray-800">
                <h2 className="text-lg font-semibold mb-2">Transcribed Text</h2>
                <p className="text-gray-300 text-sm">{transcribedText}</p>
              </Card>
            )}

            {/* Parse Error */}
            {parseError && (
              <Card className="p-6 bg-red-900/20 border-red-800">
                <h2 className="text-lg font-semibold mb-2 text-red-400">Parse Error</h2>
                <p className="text-red-300 text-sm">{parseError}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => parseWorkflow(transcribedText)}
                >
                  Retry
                </Button>
              </Card>
            )}

            {/* Workflow Action Buttons */}
            {workflow && (
              <Card className="p-6 bg-gray-900/50 border-gray-800">
                <div className="space-y-3">
                  {/* Execution Mode Toggle */}
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${useBackgroundExecution ? 'text-yellow-400' : 'text-gray-500'}`} />
                      <span className="text-sm font-medium">Background Execution</span>
                    </div>
                    <Button
                      size="sm"
                      variant={useBackgroundExecution ? "default" : "outline"}
                      onClick={() => setUseBackgroundExecution(!useBackgroundExecution)}
                      className={useBackgroundExecution ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                    >
                      {useBackgroundExecution ? 'ON' : 'OFF'}
                    </Button>
                  </div>
                  
                  {useBackgroundExecution && (
                    <div className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-xs text-yellow-300">
                      <strong>⚡ Inngest Mode:</strong> Workflow runs in background with automatic retries
                    </div>
                  )}

                  {/* Node Manipulation Mode Toggle */}
                  <Button
                    onClick={toggleNodeManipulationMode}
                    variant={isNodeManipulationMode ? "default" : "outline"}
                    size="lg"
                    className={`w-full gap-2 ${isNodeManipulationMode ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                    disabled={isExecuting}
                  >
                    <RefreshCw className="w-5 h-5" />
                    {isNodeManipulationMode ? '💾 Save & Exit' : '✏️ Edit Nodes'}
                  </Button>
                  
                  {/* Edit Workflow Button */}
                  <Button
                    onClick={toggleEditMode}
                    variant={isEditMode ? "default" : "outline"}
                    size="lg"
                    className={`w-full gap-2 ${isEditMode ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                    disabled={isNodeManipulationMode}
                  >
                    <Mic className="w-5 h-5" />
                    {isEditMode ? '✓ Voice Edit Active' : '🎙️ Voice Edit'}
                  </Button>
                  
                  {/* Run Workflow Button */}
                  {!isExecuting && (
                    <Button
                      onClick={handleRunWorkflow}
                      size="lg"
                      className="w-full gap-2"
                      disabled={isEditMode || isNodeManipulationMode}
                    >
                      <Play className="w-5 h-5" />
                      {useBackgroundExecution ? 'Run in Background' : 'Run Workflow'}
                    </Button>
                  )}
                </div>
                
                {isEditMode && (
                  <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <p className="text-xs text-purple-300">
                      <strong>Voice Edit Examples:</strong><br/>
                      • "Add a Slack notification step"<br/>
                      • "Remove the email step"<br/>
                      • "Add another summary step before email"
                    </p>
                  </div>
                )}
                
                {isNodeManipulationMode && (
                  <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                    <p className="text-xs text-orange-300">
                      <strong>✏️ Node Edit Mode:</strong><br/>
                      • <strong>Drag</strong> nodes to reposition<br/>
                      • Click <strong>×</strong> button to delete node<br/>
                      • Edges update automatically
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* Execution Logs */}
            {executionLogs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Execution Logs</h2>
                  {executionTime && !isExecuting && (
                    <span className="text-sm text-green-400">
                      Completed in {executionTime}s
                    </span>
                  )}
                </div>
                <ExecutionLogs logs={executionLogs} />
              </div>
            )}
          </div>

          {/* Right Panel - Workflow Canvas */}
          <div className="lg:sticky lg:top-8 h-[600px]">
            <Card className="h-full bg-gray-900/50 border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold">Workflow Graph</h2>
                <p className="text-sm text-gray-400">Visual representation of your workflow</p>
              </div>
              <div className="h-[calc(100%-80px)]">
                <WorkflowCanvas
                  nodes={workflow?.nodes || []}
                  edges={workflow?.edges || []}
                  activeNodeId={activeNodeId}
                  onNodePositionUpdate={handleNodePositionUpdate}
                  onNodeDelete={handleNodeDelete}
                  isInteractive={isNodeManipulationMode && !isExecuting && !isEditMode}
                />
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Config Modal */}
      {workflow && (
        <ConfigModal
          open={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          onSubmit={executeWorkflow}
          workflowNodes={workflow.nodes}
        />
      )}

      {/* Workflow History */}
      <WorkflowHistory onRestore={handleRestoreWorkflow} />
    </div>
  );
}
