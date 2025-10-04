'use client';

import { useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { ExecutionLog } from '@/lib/types';

interface LogItem extends ExecutionLog {}

interface VisualDebuggerProps {
  open: boolean;
  onClose: () => void;
  logs: LogItem[];
  transcribedText?: string;
  workflowId?: string | null;
}

export function VisualDebugger({ open, onClose, logs, transcribedText, workflowId }: VisualDebuggerProps) {
  const [activeTab, setActiveTab] = useState<'logs' | 'ai' | 'metrics'>('logs');
  const [question, setQuestion] = useState('Why did my workflow stop?');
  const [answer, setAnswer] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedLogs = useMemo(() => {
    return [...(logs || [])].sort((a, b) => a.timestamp - b.timestamp);
  }, [logs]);

  // Compute per-step metrics based on logs
  const metrics = useMemo(() => {
    const byNode: Record<string, { start?: number; end?: number; label?: string; tokens?: number; cost?: number }> = {};
    const tokenRegex = /(tokens|input_tokens|output_tokens)[:=]\s*(\d+)/i;
    const costRegex = /\$\s?(\d+(?:\.\d+)?)/;

    for (const l of sortedLogs) {
      const id = l.nodeId;
      if (!byNode[id]) byNode[id] = {};
      if (l.type === 'progress') {
        if (byNode[id].start === undefined) byNode[id].start = l.timestamp;
        // Try to capture a friendly label from first progress message
        if (!byNode[id].label) byNode[id].label = l.message.replace(/^(Executing\s+|Start\s+)/i, '').replace(/\.\.\.$/, '');
      }
      if (l.type === 'success' || l.type === 'error') {
        byNode[id].end = l.timestamp;
      }
      // Use structured metrics if present; fallback to regex on messages
      if (l.metrics) {
        if (typeof l.metrics.inputTokens === 'number') byNode[id].tokens = (byNode[id].tokens || 0) + l.metrics.inputTokens;
        if (typeof l.metrics.outputTokens === 'number') byNode[id].tokens = (byNode[id].tokens || 0) + l.metrics.outputTokens;
        if (typeof l.metrics.costUSD === 'number') byNode[id].cost = (byNode[id].cost || 0) + l.metrics.costUSD;
      } else {
        const tMatch = l.message && l.message.match(tokenRegex);
        if (tMatch) {
          const t = parseInt(tMatch[2], 10);
          byNode[id].tokens = (byNode[id].tokens || 0) + (isNaN(t) ? 0 : t);
        }
        const cMatch = l.message && l.message.match(costRegex);
        if (cMatch) {
          const c = parseFloat(cMatch[1]);
          byNode[id].cost = (byNode[id].cost || 0) + (isNaN(c) ? 0 : c);
        }
      }
    }

    const rows = Object.entries(byNode).map(([nodeId, info]) => {
      const stepMatch = nodeId.match(/step-(\d+)/);
      const stepNumber = stepMatch ? Number(stepMatch[1]) + 1 : undefined;
      const duration = info.start !== undefined && info.end !== undefined ? Math.max(0, info.end - info.start) : undefined;
      return { nodeId, stepNumber, label: info.label, duration, tokens: info.tokens, cost: info.cost };
    }).sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0));

    const totalDuration = sortedLogs.length > 0 ? (sortedLogs[sortedLogs.length - 1].timestamp - sortedLogs[0].timestamp) : 0;
    const totalTokens = rows.reduce((s, r) => s + (r.tokens || 0), 0);
    const totalCost = rows.reduce((s, r) => s + (r.cost || 0), 0);
    return { rows, totalDuration, totalTokens, totalCost };
  }, [sortedLogs]);

  const fmtMs = (ms?: number) => {
    if (ms === undefined) return '—';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const remS = s % 60;
    const remMs = ms % 1000;
    return m > 0 ? `${m}m ${remS}.${String(remMs).padStart(3, '0')}s` : `${remS}.${String(remMs).padStart(3, '0')}s`;
  };

  const runDebugger = async () => {
    try {
      setLoading(true);
      setError(null);
      setAnswer('');

      const res = await fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: sortedLogs, question, transcribedText, workflowId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get analysis');
      setAnswer(data.answer || 'No answer');
    } catch (e: any) {
      setError(e.message || 'Failed to get analysis');
    } finally {
      setLoading(false);
    }
  };

  // Minimal pretty markdown rendering without extra libs
  const Pretty = ({ text }: { text: string }) => {
    const lines = (text || '').split('\n');
    return (
      <div className="space-y-1 text-sm">
        {lines.map((line, i) => {
          // Bold **text**
          const withBold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1<\/strong>');
          // Bullet heuristic
          if (/^\s*[-*]\s+/.test(line)) {
            const item = line.replace(/^\s*[-*]\s+/, '');
            return (
              <div key={i} className="pl-4 before:content-['•'] before:mr-2" dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1<\/strong>') }} />
            );
          }
          // Heading heuristic
          if (/^\s*#{1,3}\s+/.test(line)) {
            const h = line.replace(/^\s*#{1,3}\s+/, '');
            return (
              <div key={i} className="mt-2 text-[0.95rem] font-semibold" dangerouslySetInnerHTML={{ __html: h.replace(/\*\*(.*?)\*\*/g, '<strong>$1<\/strong>') }} />
            );
          }
          return <div key={i} dangerouslySetInnerHTML={{ __html: withBold }} />;
        })}
      </div>
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}></div>
      <Card className="relative z-[101] w-[min(95vw,1000px)] h-[85vh] bg-black text-white border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="text-base font-semibold">Visual Debugger</div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className={`text-xs ${activeTab === 'logs' ? 'bg-white/10' : ''}`} onClick={() => setActiveTab('logs')}>Execution Logs</Button>
            <Button size="sm" variant="ghost" className={`text-xs ${activeTab === 'metrics' ? 'bg-white/10' : ''}`} onClick={() => setActiveTab('metrics')}>Metrics</Button>
            <Button size="sm" variant="ghost" className={`text-xs ${activeTab === 'ai' ? 'bg-white/10' : ''}`} onClick={() => setActiveTab('ai')}>AI Helper</Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={onClose}>Close</Button>
          </div>
        </div>

        {activeTab === 'logs' && (
          <div className="p-5 space-y-3 overflow-auto flex-1">
            {sortedLogs.length === 0 && (
              <div className="text-sm text-white/60">No logs yet.</div>
            )}
            {sortedLogs.map((log, idx) => {
              const stepMatch = log.nodeId?.match(/step-(\d+)/);
              const stepNumber = stepMatch ? Number(stepMatch[1]) + 1 : undefined;
              return (
              <div key={idx} className={`rounded-xl border px-4 py-3 ${log.type === 'error' ? 'border-white/20 bg-white/5' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="uppercase tracking-wider">{log.type}{stepNumber ? ` · Step ${stepNumber}` : ''}</span>
                </div>
                <div className="mt-1 text-sm font-medium">{log.message}</div>
                <div className="mt-1 text-xs text-white/60">{stepNumber ? `Step ${stepNumber}` : 'Node'}: {log.nodeId}</div>
                {log.metrics && (
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] text-white/70">
                    {'promptChars' in (log.metrics || {}) && (
                      <div>Prompt chars: <span className="text-white">{log.metrics?.promptChars}</span></div>
                    )}
                    {'outputChars' in (log.metrics || {}) && (
                      <div>Output chars: <span className="text-white">{log.metrics?.outputChars}</span></div>
                    )}
                    {'inputTokens' in (log.metrics || {}) && (
                      <div>In tokens: <span className="text-white">{log.metrics?.inputTokens}</span></div>
                    )}
                    {'outputTokens' in (log.metrics || {}) && (
                      <div>Out tokens: <span className="text-white">{log.metrics?.outputTokens}</span></div>
                    )}
                    {'costUSD' in (log.metrics || {}) && (
                      <div className="col-span-2 md:col-span-1">Cost: <span className="text-white">{log.metrics?.costUSD?.toFixed ? `$${log.metrics?.costUSD?.toFixed(6)}` : '—'}</span></div>
                    )}
                  </div>
                )}
              </div>
            );})}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="p-5 space-y-4 overflow-auto flex-1">
            <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-sm">
              <div className="flex items-center justify-between">
                <div>Total Duration</div>
                <div className="font-semibold">{fmtMs(metrics.totalDuration)}</div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div>Total Tokens</div>
                <div className="font-semibold">{metrics.totalTokens || '—'}</div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div>Estimated Cost</div>
                <div className="font-semibold">{metrics.totalCost ? `$${metrics.totalCost.toFixed(4)}` : '—'}</div>
              </div>
            </div>

            <div className="space-y-3">
              {metrics.rows.map((r, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium">{r.stepNumber ? `Step ${r.stepNumber}` : r.nodeId}</div>
                    <div className="text-white/70">{fmtMs(r.duration)}</div>
                  </div>
                  {r.label && <div className="text-xs text-white/70 mt-1">{r.label}</div>}
                  <div className="flex items-center gap-6 text-xs text-white/70 mt-2">
                    <div>Tokens: <span className="text-white">{r.tokens ?? '—'}</span></div>
                    <div>Cost: <span className="text-white">{r.cost ? `$${r.cost.toFixed(6)}` : '—'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="p-5 space-y-4 overflow-auto flex-1">
            <div className="text-xs text-white/70">Ask the debugger about this run. It only uses the current run's logs.</div>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 bg-black border border-white/15 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/30"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Why did my workflow stop?"
              />
              <Button onClick={runDebugger} disabled={loading} className="bg-black text-white hover:bg-black/80 text-sm">
                {loading ? 'Thinking…' : 'Ask' }
              </Button>
            </div>
            {error && <div className="text-xs text-red-400">{error}</div>}
            {answer && (
              <div className="rounded-xl border border-white/15 bg-white/5 p-4 overflow-auto max-h-[60vh]">
                <Pretty text={answer} />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}


