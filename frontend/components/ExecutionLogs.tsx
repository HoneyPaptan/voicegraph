'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Info, Loader2 } from 'lucide-react';
import { ExecutionLog } from '@/lib/types';
import { Card } from './ui/card';

interface ExecutionLogsProps {
  logs: ExecutionLog[];
}

/**
 * ExecutionLogs - Displays real-time execution logs with animations
 */
export function ExecutionLogs({ logs }: ExecutionLogsProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'progress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'progress':
        return 'text-blue-400';
      default:
        return 'text-gray-300';
    }
  };

  // Filter logs to hide "progress" logs for nodes that have completed
  const filteredLogs = logs.filter((log, index) => {
    // Keep all non-progress logs
    if (log.type !== 'progress') return true;
    
    // For progress logs, check if there's a later success/error log for the same node
    const hasCompletedLater = logs.slice(index + 1).some(
      laterLog => 
        laterLog.nodeId === log.nodeId && 
        (laterLog.type === 'success' || laterLog.type === 'error')
    );
    
    // Only show progress log if node hasn't completed yet
    return !hasCompletedLater;
  });

  if (logs.length === 0) {
    return (
      <Card className="p-4 bg-gray-900/50 border-gray-800">
        <div className="text-gray-500 text-sm text-center">
          Execution logs will appear here...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gray-900/50 border-gray-800 max-h-64 overflow-y-auto">
      <div className="space-y-2">
        {filteredLogs.map((log, index) => (
          <motion.div
            key={`${log.nodeId}-${index}-${log.timestamp}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-2 text-sm"
          >
            {getIcon(log.type)}
            <div className={`flex-1 ${getTextColor(log.type)}`}>
              {log.message}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(log.timestamp).toLocaleTimeString()}
            </div>
          </motion.div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </Card>
  );
}

