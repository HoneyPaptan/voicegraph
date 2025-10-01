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
    
    // For progress logs, check if there's ANY success/error log for the same node (not just later)
    const hasCompleted = logs.some(
      otherLog => 
        otherLog.nodeId === log.nodeId && 
        (otherLog.type === 'success' || otherLog.type === 'error') &&
        otherLog.timestamp >= log.timestamp // Only consider completion logs after progress
    );
    
    // Also hide progress logs if there's a system completion log
    const workflowCompleted = logs.some(
      systemLog => 
        systemLog.nodeId === 'system' && 
        systemLog.type === 'success' &&
        systemLog.message.includes('completed successfully')
    );
    
    // Only show progress log if node hasn't completed yet and workflow isn't done
    return !hasCompleted && !workflowCompleted;
  });

  if (logs.length === 0) {
    return (
      <div className="text-gray-500 text-xs text-center py-4">
        Execution logs will appear here...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredLogs.map((log, index) => (
        <motion.div
          key={`${log.nodeId}-${index}-${log.timestamp}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-2 text-xs"
        >
          {getIcon(log.type)}
          <div className={`flex-1 ${getTextColor(log.type)}`}>
            {log.message}
          </div>
          <div className="text-[10px] text-gray-500">
            {new Date(log.timestamp).toLocaleTimeString()}
          </div>
        </motion.div>
      ))}
      <div ref={logsEndRef} />
    </div>
  );
}

