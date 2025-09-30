'use client';

import { useState } from 'react';
import { VoiceInput } from '@/components/VoiceInput';
import { WorkflowCanvas } from '@/components/WorkflowCanvas';
import { ExecutionLogs } from '@/components/ExecutionLogs';
import { ConfigModal } from '@/components/ConfigModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Workflow, ExecutionLog } from '@/lib/types';
import { Sparkles, Play, RefreshCw, Loader2 } from 'lucide-react';

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

  // Handle transcription
  const handleTranscribed = async (text: string) => {
    setTranscribedText(text);
    setParseError(null);
    
    // Automatically parse workflow
    await parseWorkflow(text);
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
    } catch (error: any) {
      console.error('Parse error:', error);
      setParseError(error.message);
    } finally {
      setIsParsingWorkflow(false);
    }
  };

  // Start workflow execution
  const handleRunWorkflow = () => {
    setShowConfigModal(true);
  };

  // Execute workflow with config
  const executeWorkflow = async (config: Record<string, string>) => {
    if (!workflow) return;

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
              <h2 className="text-lg font-semibold mb-4">Voice Input</h2>
              <VoiceInput onTranscribed={handleTranscribed} />
              
              {isParsingWorkflow && (
                <div className="mt-4 flex items-center justify-center gap-2 text-blue-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing workflow with Cerebras AI...
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

            {/* Execution Controls */}
            {workflow && !isExecuting && (
              <Card className="p-6 bg-gray-900/50 border-gray-800">
                <Button
                  onClick={handleRunWorkflow}
                  size="lg"
                  className="w-full gap-2"
                >
                  <Play className="w-5 h-5" />
                  Run Workflow
                </Button>
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
    </div>
  );
}
