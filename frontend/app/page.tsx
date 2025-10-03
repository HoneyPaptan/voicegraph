'use client';

import { useState, useEffect } from 'react';
import { LeftSidebar } from '@/components/LeftSidebar';
import { NodesLibrary } from '@/components/NodesLibrary';
import { FloatingMicButton } from '@/components/FloatingMicButton';
import { VoiceInput } from '@/components/VoiceInput';
import { WorkflowCanvas } from '@/components/WorkflowCanvas';
import WorkflowToolbar from '@/components/motion-primitives/WorkflowToolbar';
import { ExecutionLogs } from '@/components/ExecutionLogs';
import { VisualDebugger } from '@/components/VisualDebugger';
import { ConfigModal } from '@/components/ConfigModal';
import { WorkflowHistory } from '@/components/WorkflowHistory';
import { NodeConfigPanel } from '@/components/NodeConfigPanel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Workflow, ExecutionLog, WorkflowNode } from '@/lib/types';
import { WorkflowRun } from '@/lib/workflow-history';
import { Sparkles, Play, RefreshCw, Loader2, Mic, Zap, Link2, Square, Bug } from 'lucide-react';

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
  const [successfulNodeIds, setSuccessfulNodeIds] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStartTime, setExecutionStartTime] = useState<number | null>(null);
  // Voice Edit mode (for voice-based workflow editing)
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditingWorkflow, setIsEditingWorkflow] = useState(false);
  const [useBackgroundExecution, setUseBackgroundExecution] = useState(false);
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [selectedNodeForConfig, setSelectedNodeForConfig] = useState<WorkflowNode | null>(null);
  const [toast, setToast] = useState<string | { text: string; type?: 'success' | 'error' | 'info' } | null>(null);
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [showQuickMic, setShowQuickMic] = useState(false);
  const [textCommand, setTextCommand] = useState('');
  const [inlineRecordOpen, setInlineRecordOpen] = useState(false);
  const [showDebugger, setShowDebugger] = useState(false);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

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
          
          // Extract successful nodes from logs
          const successLogs = data.run.logs.filter((log: any) => log.type === 'success');
          const successfulNodes = successLogs.map((log: any) => log.nodeId).filter((id: string) => id !== 'system');
          setSuccessfulNodeIds(successfulNodes);
          
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
            setSuccessfulNodeIds([]);
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

            // If there's an error log while status still 'running', treat as failed and stop UI
            const errorLog = data.run.logs.find((log: any) => log.type === 'error');
            if (errorLog) {
              hasCompleted = true;
              setIsExecuting(false);
              setErrorNodeId(errorLog.nodeId || null);
              setActiveNodeIds([]);
              setSuccessfulNodeIds([]);
              setCurrentWorkflowId(null);
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

    // Off-topic guard: respond gracefully to chit-chat or unrelated input
    const offTopicPatterns = [
      /how\s+are\s+you/i,
      /what'?s\s+up/i,
      /hello|hi|hey\b/i,
      /good\s+(morning|evening|night)/i,
      /tell\s+me\s+a\s+joke/i,
      /who\s+are\s+you/i,
      /your\s+name/i,
      /weather|temperature/i,
    ];
    // If the text clearly contains workflow intent, do NOT treat as off-topic
    const intentPatterns = [
      /upload|add|create|summarize|analyze|extract|email|send|fetch|search|generate|gather/i,
      /node|step|workflow/i,
      /after|before|in\s+parallel|then/i,
    ];
    const hasIntent = intentPatterns.some((re) => re.test(trimmedText));
    if (!hasIntent && offTopicPatterns.some((re) => re.test(trimmedText))) {
      setExecutionLogs((prev) => [
        ...prev,
        { nodeId: 'system', type: 'info', message: '👋 I can build and edit automation workflows. Try saying: "Upload a CSV and summarize it", or "Add a gather information step after file upload".', timestamp: Date.now() },
      ]);
      return; // Do not create or edit workflows on off-topic input
    }
    
    if (isEditMode && workflow) {
      // Edit existing workflow
      await editWorkflow(text);
    } else {
      // Create new workflow
      await parseWorkflow(text);
    }
  };

  // Handle typed command submit with off-topic guard and toasts
  const handleSubmitText = async () => {
    const text = textCommand.trim();
    if (!text) return;

    // Off-topic guard (same as voice)
    const offTopicPatterns = [
      /how\s+are\s+you/i,
      /what'?s\s+up/i,
      /hello|hi|hey\b/i,
      /good\s+(morning|evening|night)/i,
      /tell\s+me\s+a\s+joke/i,
      /who\s+are\s+you/i,
      /your\s+name/i,
      /weather|temperature/i,
    ];
    const intentPatterns = [
      /upload|add|create|summarize|analyze|extract|email|send|fetch|search|generate|gather/i,
      /node|step|workflow/i,
      /after|before|in\s+parallel|then/i,
    ];
    const hasIntent = intentPatterns.some((re) => re.test(text));
    if (!hasIntent && offTopicPatterns.some((re) => re.test(text))) {
      setToast({ text: 'I can build workflows. Try: "Upload a CSV and summarize it".', type: 'error' });
      return;
    }
    setTranscribedText(text);
    await parseWorkflow(text);
  };

  // Parse workflow from text
  const parseWorkflow = async (text: string) => {
    try {
      setIsParsingWorkflow(true);
      setParseError(null);

      setToast({ text: 'Parsing with Cerebras AI…', type: 'info' });
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
      
      // Reset execution states when creating new workflow
      setActiveNodeIds([]);
      setErrorNodeId(null);
      setSuccessfulNodeIds([]);
      setExecutionLogs([]);
      setIsExecuting(false);
      setExecutionStartTime(null);
    } catch (error: any) {
      console.error('Parse error:', error);
      setParseError(error.message);
      setToast({ text: 'Parsing failed. Open Debugger for details.', type: 'error' });
    } finally {
      setIsParsingWorkflow(false);
      // clear info toast if still there
      setToast((prev) => (prev && (prev as any).type === 'info' ? null : prev));
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
      
      // Reset execution states when editing workflow
      setActiveNodeIds([]);
      setErrorNodeId(null);
      setSuccessfulNodeIds([]);
      setExecutionLogs([]);
      setIsExecuting(false);
      setExecutionStartTime(null);
      
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
    setSuccessfulNodeIds([]);

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

      // Immediately mark UI as running; polling will transition to running when history updates
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
    
    // Extract successful nodes from logs
    const successLogs = run.logs.filter((log) => log.type === 'success');
    const successfulNodes = successLogs.map((log) => log.nodeId).filter((id) => id !== 'system');
    setSuccessfulNodeIds(successfulNodes);
    
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
      setSuccessfulNodeIds([]);
    } else if (run.status === 'completed') {
      setIsExecuting(false);
      setActiveNodeIds([]);
      setErrorNodeId(null);
    }
    
    // Clear edit mode and reset execution states
    setIsEditMode(false);
    setParseError(null);
    
    // Ensure execution states are properly reset
    if (run.status === 'completed') {
      setActiveNodeIds([]);
      setErrorNodeId(null);
    } else if (run.status === 'failed') {
      setActiveNodeIds([]);
    }
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
    setSuccessfulNodeIds([]);
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

      let shouldStopOnError = false;
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Stream ended - always stop loading
          console.log('SSE stream ended, stopping execution');
          setIsExecuting(false);
          setActiveNodeIds([]);
          setExecutionStartTime(null);
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
                metrics: data.metrics,
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
                // Remove completed node from active list and add to successful list
                setActiveNodeIds(prev => prev.filter(id => id !== data.nodeId));
                setSuccessfulNodeIds(prev => [...prev, data.nodeId]);
                // if success from LLM with metrics, nothing else
              } else if (data.type === 'error') {
                // Error occurred - stop everything immediately
                console.log('Error detected, stopping execution');
                setErrorNodeId(data.nodeId);
                setActiveNodeIds([]);
                setIsExecuting(false);
                setExecutionStartTime(null);
                // Cancel the stream reader so we can run again immediately
                shouldStopOnError = true;
                setToast({ text: 'Workflow failed. Open Debugger for details and quick fix.', type: 'error' });
              } else if (data.type === 'complete') {
                // Workflow completed successfully
                console.log('Workflow completed successfully');
                setActiveNodeIds([]);
                setIsExecuting(false);
                setErrorNodeId(null);
                setExecutionStartTime(null);
                
                // Add a final completion log to ensure clean state
                const completionLog: ExecutionLog = {
                  nodeId: 'system',
                  type: 'success',
                  message: '✅ All workflows completed successfully',
                  timestamp: Date.now(),
                };
                setExecutionLogs((prev) => [...prev, completionLog]);
                setToast({ text: 'Workflow completed successfully.', type: 'success' });
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }

        if (shouldStopOnError) {
          try { await reader.cancel(); } catch {}
          break;
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
      
      // Reset execution states when creating new workflow
      setActiveNodeIds([]);
      setErrorNodeId(null);
      setSuccessfulNodeIds([]);
      setExecutionLogs([]);
      setIsExecuting(false);
      setExecutionStartTime(null);
      
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
    
    // Reset execution states when modifying workflow
    setActiveNodeIds([]);
    setErrorNodeId(null);
    setSuccessfulNodeIds([]);
    setExecutionLogs([]);
    setIsExecuting(false);
    setExecutionStartTime(null);
    
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
    
    // Reset execution states when modifying workflow structure
    setActiveNodeIds([]);
    setErrorNodeId(null);
    setSuccessfulNodeIds([]);
    setExecutionLogs([]);
    setIsExecuting(false);
    setExecutionStartTime(null);
  };

  // Handle edge deletion
  const handleEdgeDelete = (edgeId: string) => {
    if (!workflow) return;
    
    console.log('🗑️ Deleting edge:', edgeId);
    
    setWorkflow({
      ...workflow,
      edges: workflow.edges.filter(e => e.id !== edgeId),
    });
    
    // Reset execution states when modifying workflow structure
    setActiveNodeIds([]);
    setErrorNodeId(null);
    setSuccessfulNodeIds([]);
    setExecutionLogs([]);
    setIsExecuting(false);
    setExecutionStartTime(null);
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
        // For file upload nodes, store file content in the node structure
        if (['file_upload', 'csv_upload', 'pdf_upload', 'txt_upload'].includes(node.type) && params.fileContent) {
          return {
            ...node,
            params,
            fileContent: params.fileContent,
            uploadedFile: params.uploadedFile, // Store the file reference if available
          };
        }
        
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
    // Keep the current workflow container but clear nodes and edges so we stay on the canvas
    if (workflow) {
      setWorkflow({
        ...workflow,
        nodes: [],
        edges: [],
      });
    }

    // Clear UI/exec states
    setTranscribedText('');
    setParseError(null);
    setExecutionLogs([]);
    setActiveNodeIds([]);
    setErrorNodeId(null);
    setSuccessfulNodeIds([]);
    setIsExecuting(false);
    setExecutionStartTime(null);
    setIsEditMode(false);
    setSelectedNodeForConfig(null);
  };

  // Toggle edit mode
  // Toggle Voice Edit mode
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
    <div className={`relative min-h-screen w-full overflow-hidden text-white ${!workflow ? 'noisy-bg' : 'bg-black'}`}>
      {/* Listen for debugger open events from the top-left icon */}
      <ScriptListener setShowDebugger={setShowDebugger} />
      {/* Full-Screen Workflow Canvas Background */}
      <div className="absolute inset-0 w-full h-full z-[1]">
        <WorkflowCanvas
          nodes={workflow?.nodes || []}
          edges={workflow?.edges || []}
          activeNodeIds={activeNodeIds}
          errorNodeId={errorNodeId}
          successfulNodeIds={successfulNodeIds}
          onNodeDragStop={handleNodeDragStop}
          onNodeDelete={handleNodeDelete}
          onNodeClick={handleNodeClick}
          onEdgeConnect={handleEdgeConnect}
          onEdgeDelete={handleEdgeDelete}
          isInteractive={!isExecuting}
          allowConnections={!isExecuting}
          onError={(msg) => setToast(msg)}
        />
      </div>

      {/* Floating UI Elements */}
      <div className="relative z-10 pointer-events-none">
        {/* Left Sidebar - Collapsible Tools */}
        <LeftSidebar
          onTranscribed={handleTranscribed}
          onLoadExample={loadExample}
          onAddNode={handleAddNode}
          manualMode={manualMode}
          onToggleManualMode={() => setManualMode(!manualMode)}
          hasWorkflow={!!workflow}
        />

        {/* Inline Nodes Library - show only when a workflow exists */}
        {workflow && (
          <div className="fixed top-1/2 left-6 -translate-y-1/2 pointer-events-auto z-30 w-56 hidden md:block">
            <Card className="text-white flex flex-col gap-6 rounded-xl border p-3 bg-black/95 border-white/20 backdrop-blur-md shadow-2xl overflow-y-auto max-h-[70vh]">
              <div className="text-xs font-semibold mb-2 text-white">Add Nodes</div>
              <NodesLibrary onAddNode={handleAddNode} compact />
          </Card>
        </div>
        )}

        {/* Top Header removed per request */}

        {/* Center Floating Mic Button - Only show when NO workflow */}
        {!workflow && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-auto z-30">
            <div className="flex items-stretch justify-center">
              {/* Split container */}
              <div className="bg-black/80 border border-white/10 rounded-xl shadow-2xl w-[960px] max-w-[92vw] h-[420px] overflow-hidden flex">
                {/* Left: Recording + Start from blank */}
                <div className="flex flex-col items-center justify-center gap-6 w-1/2 p-6">
                  <div className="w-full max-w-sm mx-auto text-center">
                    <div className="text-3xl md:text-4xl font-semibold text-white mb-3">Voice Graph</div>
                    <div className="text-[15px] leading-tight text-white/70 mb-5">
                      Build a voice‑to‑workflow automation system<br/>with visual graph interface.
                </div>
                    {/* Input with mic and send */}
                    <div className="relative w-full">
                        <input
                          value={textCommand}
                          onChange={(e) => setTextCommand(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitText(); }}
                          placeholder="Describe your automation..."
                          className="w-full bg-black border border-white/15 rounded-lg pl-4 pr-32 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-white/30"
                        />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Button size="sm" variant="ghost" className={`w-9 h-8 p-0 justify-center ${inlineRecordOpen ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-black text-white hover:bg-black/80'}`} onClick={() => {
                          if (workflow) {
                            setShowQuickMic(true);
                          } else {
                            setInlineRecordOpen((v) => !v);
                          }
                        }}>
                          {inlineRecordOpen ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" className=" bg-white hover:bg-white/80 h-8 px-3" onClick={handleSubmitText}>
                          Send
                        </Button>
                      </div>
                    </div>
                    {inlineRecordOpen && !workflow && (
                      <div className="mt-4">
                        <Card className="p-4 bg-black border border-white/15 text-white rounded-xl">
                          <div className="text-xs text-white/70 mb-2">Speak your automation. Recording starts immediately.</div>
                          <VoiceInput onTranscribed={async (text) => {
                            try {
                              setInlineRecordOpen(false);
                              await handleTranscribed(text);
                            } catch (e) {
                              console.error(e);
                              setToast({ text: 'Voice input failed. See Debugger for details.', type: 'error' });
                            }
                          }} autoStart />
                </Card>
                      </div>
                    )}
                    <div className="mt-6 flex items-center justify-center text-white/40 text-xs select-none">
                      <span className="px-2">—</span>
                      <span>or</span>
                      <span className="px-2">—</span>
                    </div>
                    <div className="mt-3 flex items-center justify-center">
                  <Button
                    variant="outline"
                        className="h-10 px-4 bg-black/40 hover:bg-black/60 border-white/20 text-white w-full"
                        onClick={() => {
                          setWorkflow({ workflowId: `workflow-${Date.now()}`, nodes: [], edges: [] });
                          // Reset execution states when creating blank workflow
                          setActiveNodeIds([]);
                          setErrorNodeId(null);
                          setSuccessfulNodeIds([]);
                          setExecutionLogs([]);
                          setIsExecuting(false);
                          setExecutionStartTime(null);
                        }}
                      >
                        Start from blank
                  </Button>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px bg-white/15" />

                {/* Right: Templates */}
                <div className="w-1/2 p-6 flex flex-col">
                  <div className="mb-3 text-center text-white text-sm">Quick templates</div>

                  {/* Developer */}
                  <div className="mb-4">
                    <div className="text-xs uppercase tracking-wide text-white/70 mb-2">Developer</div>
                      <Button
                        variant="outline"
                      className="w-full h-auto text-left bg-black/40 hover:bg-black/60 border-white/20 text-white justify-start p-4"
                        onClick={() => loadExample('Get recent commits from my GitHub repository, analyze the code changes, and create a Notion page with development summary')}
                      >
                      <div>
                        <div className="font-medium">Dev Progress Tracker</div>
                        <div className="text-xs text-white/60 mt-1">Analyze recent commits and produce a Notion summary.</div>
                        </div>
                      </Button>
                        </div>

                  {/* Traveler */}
                  <div className="mb-4">
                    <div className="text-xs uppercase tracking-wide text-white/70 mb-2">Traveler</div>
                      <Button
                        variant="outline"
                      className="w-full h-auto text-left bg-black/40 hover:bg-black/60 border-white/20 text-white justify-start p-4"
                      onClick={() => {
                        const now = Date.now();
                        const nodes: WorkflowNode[] = [
                          {
                            id: 'step-0',
                            type: 'prompt' as any,
                            action: 'seed',
                            label: 'Trip Request',
                            params: {
                              text: 'Enter your destination and (optional) dates. Example: Jaipur, 12-16 Oct.'
                            },
                            position: { x: 400, y: 50 },
                          },
                          {
                            id: 'step-1',
                            type: 'tavily' as any,
                            action: 'search',
                            label: 'Find Routes',
                            params: {
                              query: 'fastest and cheapest routes to {input} flights trains buses with booking urls',
                              maxResults: 5,
                            },
                            position: { x: 200, y: 200 },
                          },
                          {
                            id: 'step-2',
                            type: 'tavily' as any,
                            action: 'search',
                            label: 'Find Hotels',
                            params: {
                              query: 'best hotels near {input} city center budget friendly 3-4 star with direct booking urls',
                              maxResults: 5,
                              includeDomains: ['booking.com','hotels.com','tripadvisor.com'],
                            },
                            position: { x: 600, y: 200 },
                          },
                          {
                            id: 'step-3',
                            type: 'llm' as any,
                            action: 'summarize',
                            label: 'Summarize Itinerary',
                            params: {
                              prompt: 'Create a trip plan that strictly uses the provided destination and dates from the input; never assume a different city. Include: 1) Fastest route with Google Maps or booking URL; 2) Cheapest viable route with Google Maps or booking URL; 3) A table of 5 hotels (Name, Area, Price range, Direct URL); 4) Short day-by-day outline. If info is missing, say "Not found" instead of assuming.'
                            },
                            position: { x: 400, y: 350 },
                          },
                          {
                            id: 'step-4',
                            type: 'email' as any,
                            action: 'send',
                            label: 'Email Plan',
                            params: { subject: 'Your Trip Plan' },
                            position: { x: 400, y: 500 },
                          },
                        ];
                        const edges = [
                          { id: 'edge-0', source: 'step-0', target: 'step-1' },
                          { id: 'edge-1', source: 'step-1', target: 'step-3' },
                          { id: 'edge-2', source: 'step-0', target: 'step-2' },
                          { id: 'edge-3', source: 'step-2', target: 'step-3' },
                          { id: 'edge-4', source: 'step-3', target: 'step-4' },
                        ];
                        setWorkflow({ workflowId: `workflow-${now}`, nodes, edges });
                        // Reset execution states when loading template
                        setActiveNodeIds([]);
                        setErrorNodeId(null);
                        setSuccessfulNodeIds([]);
                        setExecutionLogs([]);
                        setIsExecuting(false);
                        setExecutionStartTime(null);
                      }}
                    >
                      <div>
                        <div className="font-medium">Trip Planner</div>
                        <div className="text-xs text-white/60 mt-1">Find routes & hotels for your destination and email a concise plan.</div>
                        </div>
                      </Button>
                  </div>

                  {/* Researcher */}
                  <div className="mb-2">
                    <div className="text-xs uppercase tracking-wide text-white/70 mb-2">Researcher</div>
                    <Button
                      variant="outline"
                      className="w-full h-auto text-left bg-black/40 hover:bg-black/60 border-white/20 text-white justify-start p-4"
                      onClick={() => loadExample('Search for latest AI news, analyze trends and innovations, then email me market insights report')}
                    >
                      <div>
                        <div className="font-medium">Market Intelligence</div>
                        <div className="text-xs text-white/60 mt-1">Search news, analyze trends, and email a quick insight report.</div>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-1/2 translate-x-1/2 md:right-6 md:translate-x-0 z-50">
          <Card className={`px-4 py-2 shadow-2xl border ${typeof toast === 'object' && toast.type === 'error' ? 'bg-black border-white/20' : typeof toast === 'object' && toast.type === 'success' ? 'bg-black border-white/20' : 'bg-black border-white/20'}`}>
            <span className={`text-sm ${typeof toast === 'object' && toast.type === 'error' ? 'text-red-400' : typeof toast === 'object' && toast.type === 'success' ? 'text-white' : 'text-white/80'}`}>{typeof toast === 'string' ? toast : toast.text}</span>
            </Card>
        </div>
      )}

      {/* Voice Edit Overlay (moved out of pointer-events-none container) */}

      {/* Right Side - Compact Info - Only show when workflow is active */}
        {workflow && (
          <div className="absolute top-6 right-6 w-72 space-y-2 pointer-events-auto max-h-[calc(100vh-120px)] overflow-y-auto pb-20">
            {/* Transcribed Text Card - Compact */}
            {transcribedText && (
              <Card className="p-2.5 bg-black/95 backdrop-blur-md border-white/20 shadow-2xl text-white">
                <h2 className="text-sm font-semibold mb-1 text-white">Transcribed Text</h2>
                <p className="text-white text-xs leading-relaxed line-clamp-4">{transcribedText}</p>
            </Card>
          )}
            {/* Debug button moved to top-left; removed from here */}
        </div>
        )}

        {/* Bottom Left - Reset Button */}
        {workflow && (
          <div className="fixed bottom-6 left-6 pointer-events-auto z-30">
            <Button 
              variant="outline" 
              onClick={handleReset} 
              className="gap-2 bg-black/95 backdrop-blur-md border-white/20 hover:bg-red-600/90 hover:border-red-600 shadow-2xl"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        )}

        {/* Top Center - Motion Primitives Toolbar */}
        {workflow && (
          <WorkflowToolbar
            onRun={handleRunWorkflow}
            onVoiceEdit={async (text) => {
              try {
                setIsEditMode(true);
                await editWorkflow(text);
              } catch (e) {
                console.error(e);
                setToast({ text: 'Voice edit failed. See Debugger for details.', type: 'error' });
              } finally {
                setIsEditMode(false);
              }
            }}
            isExecuting={isExecuting}
            useBackgroundExecution={useBackgroundExecution}
            onToggleBG={() => setUseBackgroundExecution(!useBackgroundExecution)}
            onOpenText={handleSubmitText}
            textCommand={textCommand}
            onTextChange={setTextCommand}
            isParsingWorkflow={isParsingWorkflow}
            isEditingWorkflow={isEditingWorkflow}
          />
        )}

      </div>

      {/* Voice Edit Overlay - top-level to ensure clickability */}
      {showVoiceOverlay && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowVoiceOverlay(false)}></div>
          <Card className="relative z-[101] p-5 bg-black border border-white/20 text-white w-[420px] rounded-2xl shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">Voice Edit</div>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setShowVoiceOverlay(false)}>Close</Button>
                </div>
            <div className="h-px bg-white/10 my-3" />
            <div className="text-xs text-white/70 mb-3">Speak your edit. Recording starts immediately.</div>
            <div>
              <VoiceInput onTranscribed={async (text) => {
                try {
                  setShowVoiceOverlay(false);
                  setIsEditMode(true);
                  await editWorkflow(text);
                } catch (e) {
                  console.error(e);
                  setToast('Voice edit failed. See logs for details.');
                } finally {
                  setIsEditMode(false);
                }
              }} isEditMode autoStart />
              </div>
            </Card>
          </div>
        )}

      {/* Quick Mic Overlay for text bar */}
      {showQuickMic && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowQuickMic(false)}></div>
          <Card className="relative z-[101] p-5 bg-black border border-white/20 text-white w-[420px] rounded-2xl shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">Voice Input</div>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setShowQuickMic(false)}>Close</Button>
      </div>
            <div className="h-px bg-white/10 my-3" />
            <div className="text-xs text-white/70 mb-3">Speak your automation. Recording starts immediately.</div>
            <VoiceInput onTranscribed={async (text) => {
              try {
                setShowQuickMic(false);
                await handleTranscribed(text);
              } catch (e) {
                console.error(e);
                setToast({ text: 'Voice input failed. See Debugger for details.', type: 'error' });
              }
            }} autoStart />
          </Card>
        </div>
      )}

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
      <WorkflowHistory onRestore={handleRestoreWorkflow} hasWorkflow={!!workflow} />

      {/* Visual Debugger Modal */}
      {workflow && (
        <VisualDebugger
          open={showDebugger}
          onClose={() => setShowDebugger(false)}
          logs={executionLogs as any}
          transcribedText={transcribedText}
          workflowId={currentWorkflowId}
        />
      )}
    </div>
  );
}

function ScriptListener({ setShowDebugger }: { setShowDebugger: (v: boolean) => void }) {
  // Subscribe to global event dispatched from LeftSidebar
  useEffect(() => {
    const handler = () => setShowDebugger(true);
    window.addEventListener('open-debugger', handler as any);
    return () => window.removeEventListener('open-debugger', handler as any);
  }, [setShowDebugger]);
  return null;
}
