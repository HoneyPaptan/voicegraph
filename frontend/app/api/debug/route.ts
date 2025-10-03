import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/cerebras';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { logs, question, transcribedText, workflowId } = body || {};

    if (!Array.isArray(logs) || typeof question !== 'string') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Only send current-run context. Trim overly long messages for safety.
    const trimmedLogs = logs.slice(-200).map((l: any) => ({
      nodeId: l.nodeId,
      type: l.type,
      message: (l.message || '').slice(0, 2000),
      timestamp: l.timestamp,
    }));

    const prompt = `You are a precise workflow debugging assistant.
Input contains the current run's execution logs (ordered) and a user question.
Goal: Explain why the workflow stopped or misbehaved and propose concrete, step-by-step fixes.

Strict rules:
- Be concise and structured.
- If missing info, state what to check.
- Suggest actionable fixes tied to specific nodes/actions.
- NEVER assume prior runs; reason only about these logs.
- Write in clear, simple, non-technical language that a non-engineer can follow.
- Use short headings and bullet points, avoid jargon.

Context:
- Workflow ID: ${workflowId ?? 'unknown'}
- Original request (if any): ${transcribedText ?? 'N/A'}
- Logs JSON (latest first listed last):
${JSON.stringify(trimmedLogs, null, 2)}

User question: ${question}

Respond with:
1) Root cause (bullet(s))
2) Evidence (cite specific log lines/timestamps)
3) Fix steps (numbered, specific)
4) Optional: improved prompt/config suggestions.

Return as plain markdown using only headings (##), bullets (-), and numbers (1.).`;

    const text = await generateContent(prompt);
    return NextResponse.json({ success: true, answer: text });
  } catch (err: any) {
    console.error('Debugger API error:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate answer' }, { status: 500 });
  }
}


