import { NextResponse } from 'next/server';
import { workflowHistory } from '@/lib/workflow-history';

/**
 * GET /api/workflow-history
 * Returns all workflow execution history
 */
export async function GET() {
  try {
    const history = workflowHistory.getAll();
    
    return NextResponse.json({ 
      success: true,
      count: history.length,
      history 
    });
  } catch (error: any) {
    console.error('Failed to fetch workflow history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow history' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflow-history/[id]
 * Returns a specific workflow run
 */
export async function POST(request: Request) {
  try {
    const { workflowId } = await request.json();
    
    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID required' },
        { status: 400 }
      );
    }

    const run = workflowHistory.get(workflowId);
    
    if (!run) {
      console.log(`❌ Workflow ${workflowId} not found in history`);
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    console.log(`📊 Returning workflow ${workflowId}: status=${run.status}, logs=${run.logs.length}`);
    return NextResponse.json({ 
      success: true,
      run 
    });
  } catch (error: any) {
    console.error('Failed to fetch workflow run:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow run' },
      { status: 500 }
    );
  }
}

