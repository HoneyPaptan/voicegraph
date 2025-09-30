import { NextRequest, NextResponse } from 'next/server';
import { parseWorkflow } from '@/lib/cerebras';
import { ensureWorkflowEdges } from '@/lib/workflow-utils';

/**
 * POST /api/parse
 * Parses natural language into workflow JSON using Cerebras
 */
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input text' },
        { status: 400 }
      );
    }

    // Check if input is too short or just punctuation/whitespace
    const trimmedText = text.trim();
    if (trimmedText.length < 5 || /^[.\s,!?-]*$/.test(trimmedText)) {
      return NextResponse.json(
        { error: 'Please provide a meaningful voice command. Try something like: "Get my Notion meeting notes and email me a summary"' },
        { status: 400 }
      );
    }

    console.log('Parsing workflow from text:', text);

    // Parse workflow using Cerebras
    let workflow = await parseWorkflow(text);

    // Ensure all nodes are connected with edges
    workflow = ensureWorkflowEdges(workflow);

    return NextResponse.json({ 
      workflow,
      success: true 
    });

  } catch (error: any) {
    console.error('Workflow parsing error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to parse workflow',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

