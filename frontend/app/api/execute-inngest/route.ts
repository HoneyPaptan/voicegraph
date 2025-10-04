import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';
import { workflowHistory } from '@/lib/workflow-history';

/**
 * POST /api/execute-inngest
 * Triggers Inngest workflow execution in the background
 */
export async function POST(request: NextRequest) {
  try {
    const { workflow, config, transcribedText } = await request.json();

    if (!workflow || !workflow.nodes) {
      return NextResponse.json(
        { error: 'Invalid workflow data' },
        { status: 400 }
      );
    }

    // Generate unique workflow ID
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create workflow run in history
    workflowHistory.create(workflowId, workflow, config, transcribedText);

    console.log(`🚀 Triggering Inngest workflow: ${workflowId}`);

    // Send event to Inngest for background processing
    console.log(`📤 Sending event to Inngest for workflow ${workflowId}`);
    try {
      const eventResult = await inngest.send({
        name: 'workflow/execute.requested',
        data: {
          workflowId,
          workflow,
          config,
          transcribedText,
        },
      });
      
      console.log(`📤 Inngest event sent successfully:`, eventResult);
    } catch (eventError) {
      console.error(`❌ Failed to send Inngest event:`, eventError);
      throw eventError;
    }

    return NextResponse.json({
      success: true,
      workflowId,
      message: 'Workflow execution started in background',
    });

  } catch (error: any) {
    console.error('Failed to trigger workflow execution:', error);
    return NextResponse.json(
      { error: `Failed to start workflow: ${error.message}` },
      { status: 500 }
    );
  }
}

