import { NextRequest, NextResponse } from 'next/server';
import { parseWorkflow } from '@/lib/cerebras';

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

    console.log('Parsing workflow from text:', text);

    // Parse workflow using Cerebras
    const workflow = await parseWorkflow(text);

    console.log('Parsed workflow:', JSON.stringify(workflow, null, 2));

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

