'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Clock, CheckCircle, XCircle, Loader2, Play, History as HistoryIcon } from 'lucide-react';
import { WorkflowRun } from '@/lib/workflow-history';

interface WorkflowHistoryProps {
  onRestore: (run: WorkflowRun) => void;
  hasWorkflow?: boolean;
}

/**
 * WorkflowHistory - Displays past workflow executions
 * Users can click to restore workflow state
 */
export function WorkflowHistory({ onRestore, hasWorkflow = false }: WorkflowHistoryProps) {
  const [history, setHistory] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Always fetch on mount and when panel opens
    fetchHistory();
    
    if (isOpen) {
      // Poll for updates every 1 second when open (faster for running workflows)
      const interval = setInterval(fetchHistory, 1000);
      return () => clearInterval(interval);
    } else {
      // Poll every 2 seconds when panel is closed (still need to update badge)
      const interval = setInterval(fetchHistory, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/workflow-history');
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to fetch workflow history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: WorkflowRun['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-white" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-white" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-white animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-white/70" />;
    }
  };

  const getStatusColor = (status: WorkflowRun['status']) => {
    switch (status) {
      case 'completed':
        return 'text-white';
      case 'failed':
        return 'text-white';
      case 'running':
        return 'text-white';
      default:
        return 'text-white/70';
    }
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    return `${duration}s`;
  };

  if (!isOpen) {
    // Only show the History button when there's an active workflow
    if (!hasWorkflow) {
      return null;
    }

    const runningCount = history.filter((run) => run.status === 'running').length;
    
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="fixed bottom-6 right-6 gap-2 bg-black/90 backdrop-blur-md border-white/20 hover:bg-white/10 shadow-2xl z-20"
      >
        <HistoryIcon className="w-4 h-4" />
        History ({history.length})
        {runningCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-white text-black text-xs rounded-full animate-pulse">
            {runningCount}
          </span>
        )}
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 max-h-[500px] bg-black/95 border-white/20 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col z-20">
      <div className="p-3 border-b border-white/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HistoryIcon className="w-4 h-4" />
          <h3 className="text-sm font-semibold text-white">Workflow History</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="text-white hover:bg-white/10"
        >
          Close
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-white/70">
            <p>No workflows executed yet</p>
            <p className="text-sm mt-2">Run a workflow to see it here!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((run) => (
              <Card
                key={run.id}
                className="p-3 bg-black/50 border-white/20 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => onRestore(run)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(run.status)}
                      <span className={`text-sm font-medium ${getStatusColor(run.status)}`}>
                        {run.status.toUpperCase()}
                      </span>
                    </div>
                    
                    {run.transcribedText && (
                      <p className="text-sm text-white/80 truncate mb-1">
                        "{run.transcribedText}"
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span>{run.workflow.nodes.length} nodes</span>
                      <span>•</span>
                      <span>{formatDuration(run.startTime.toString(), run.endTime?.toString())}</span>
                      <span>•</span>
                      <span>{new Date(run.startTime).toLocaleTimeString()}</span>
                    </div>
                    
                    {run.error && (
                      <p className="text-xs text-white mt-1 truncate">
                        Error: {run.error}
                      </p>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-white hover:bg-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore(run);
                    }}
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

