import { NextRequest, NextResponse } from 'next/server';
import { workflowHistory } from '@/lib/workflow-history';
import { executeNode } from '@/lib/executor';
import { analyzeParallelWorkflow } from '@/lib/parallel-executor';
import { WorkflowNode, ExecutionContext, WorkflowEdge } from '@/lib/types';

/**
 * POST /api/execute-background
 * Executes workflow in background without Inngest (fallback)
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

    console.log(`🚀 Starting background workflow execution: ${workflowId}`);

    // Update status to running
    workflowHistory.updateStatus(workflowId, 'running');

    // Execute workflow in background (non-blocking)
    executeWorkflowInBackground(workflowId, workflow, config).catch(error => {
      console.error(`❌ Background workflow ${workflowId} failed:`, error);
      workflowHistory.updateStatus(workflowId, 'failed', error.message);
    });

    return NextResponse.json({
      success: true,
      workflowId,
      message: 'Workflow execution started in background',
    });

  } catch (error: any) {
    console.error('Failed to start background workflow execution:', error);
    return NextResponse.json(
      { error: `Failed to start workflow: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Execute workflow in background
 */
async function executeWorkflowInBackground(
  workflowId: string,
  workflow: any,
  config: Record<string, string>
) {
  try {
    console.log(`🔄 Executing workflow ${workflowId} in background`);

    // Initialize execution context
    const context: ExecutionContext = {
      ...config,
      notionPageId: config.notionPageId,
      notionDatabaseId: config.notionDatabaseId,
      recipientEmail: config.recipientEmail,
      githubRepoUrl: config.githubRepoUrl,
      outputs: {},
      lastOutput: undefined,
      sourceContent: undefined,
    };

    // Analyze parallel structure
    const layers = analyzeParallelWorkflow(workflow.nodes, workflow.edges);
    console.log(`📊 Workflow has ${layers.length} execution layer(s)`);

    // Execute nodes layer by layer
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
      const layer = layers[layerIndex];
      
      console.log(`⚡ Layer ${layerIndex}: Executing ${layer.nodes.length} node(s) in parallel`);

      // Execute all nodes in this layer in parallel
      const results = await Promise.all(
        layer.nodes.map(async (node) => {
          workflowHistory.addLog(workflowId, {
            type: 'progress',
            nodeId: node.id,
            message: `Executing ${node.label || node.type}...`,
            timestamp: Date.now(),
          });

          console.log(`🔍 Executing node ${node.id} (${node.type}) with context:`, {
            lastOutput: context.lastOutput ? context.lastOutput.substring(0, 200) + '...' : 'undefined',
            sourceContent: context.sourceContent ? context.sourceContent.substring(0, 200) + '...' : 'undefined',
            outputs: Object.keys(context.outputs || {})
          });

          const result = await executeNode(node, context);

          console.log(`🔍 Node ${node.id} result:`, {
            success: result.success,
            outputLength: result.output ? result.output.length : 0,
            outputPreview: result.output ? result.output.substring(0, 200) + '...' : 'undefined'
          });

          if (result.success && 'output' in result) {
            workflowHistory.addLog(workflowId, {
              type: 'success',
              nodeId: node.id,
              message: `✓ ${node.label || node.type} completed`,
              timestamp: Date.now(),
            });
            
            return { node, result, success: true };
          } else {
            const errorMsg = result.error || 'Unknown error';
            workflowHistory.addLog(workflowId, {
              type: 'error',
              nodeId: node.id,
              message: `✗ ${errorMsg}`,
              timestamp: Date.now(),
            });
            throw new Error(errorMsg);
          }
        })
      );

      // Combine outputs from parallel nodes
      if (results.length > 0) {
        const combinedOutput = results
          .map(r => r.result.output)
          .filter(Boolean)
          .join('\n\n---\n\n');
        
        context.lastOutput = combinedOutput;
        context.outputs[`layer_${layerIndex}`] = combinedOutput;
      }
    }

    // Mark workflow as completed
    console.log(`🔄 Updating workflow ${workflowId} status to completed`);
    workflowHistory.updateStatus(workflowId, 'completed');
    workflowHistory.addLog(workflowId, {
      type: 'success',
      nodeId: 'system',
      message: '✅ Workflow completed successfully',
      timestamp: Date.now(),
    });
    console.log(`✅ Workflow ${workflowId} completed successfully and status updated`);

  } catch (error: any) {
    console.error(`❌ Workflow ${workflowId} failed:`, error);
    
    // Mark workflow as failed
    workflowHistory.updateStatus(workflowId, 'failed', error.message);
    workflowHistory.addLog(workflowId, {
      type: 'error',
      nodeId: 'system',
      message: `❌ Workflow failed: ${error.message}`,
      timestamp: Date.now(),
    });
  }
}
