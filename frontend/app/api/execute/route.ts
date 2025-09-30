import { NextRequest } from 'next/server';
import { executeNode } from '@/lib/executor';
import { WorkflowNode, ExecutionContext } from '@/lib/types';

/**
 * POST /api/execute
 * Executes workflow nodes sequentially with Server-Sent Events streaming
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const { nodes, config } = await request.json();

    if (!nodes || !Array.isArray(nodes)) {
      return new Response(
        JSON.stringify({ error: 'Invalid nodes array' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Starting workflow execution with config:', config);

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          // Initialize execution context with config
          const context: ExecutionContext = {
            ...config,
            notionPageId: config.notionPageId,
            notionDatabaseId: config.notionDatabaseId,
            recipientEmail: config.recipientEmail,
          };

          sendEvent({
            type: 'start',
            message: 'Starting workflow execution...',
            timestamp: Date.now(),
          });

          // Execute nodes sequentially
          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i] as WorkflowNode;

            sendEvent({
              type: 'progress',
              nodeId: node.id,
              message: `Executing ${node.label || node.type}...`,
              timestamp: Date.now(),
            });

            // Execute node
            const result = await executeNode(node, context);

            if (result.success) {
              // Store output in context for next node
              context.lastOutput = result.output;
              context[node.id] = result.output;
              
              // Store source content from Notion for later LLM nodes to reference
              if (node.type === 'notion') {
                context.sourceContent = result.output;
              }

              sendEvent({
                type: 'success',
                nodeId: node.id,
                message: `✓ ${node.label || node.type} completed`,
                output: result.output,
                timestamp: Date.now(),
              });
            } else {
              sendEvent({
                type: 'error',
                nodeId: node.id,
                message: `✗ ${node.label || node.type} failed: ${result.error}`,
                error: result.error,
                timestamp: Date.now(),
              });

              // Stop execution on error
              throw new Error(result.error);
            }
          }

          sendEvent({
            type: 'complete',
            message: '✓ Workflow completed successfully!',
            timestamp: Date.now(),
          });

          controller.close();
        } catch (error: any) {
          console.error('Workflow execution error:', error);
          
          sendEvent({
            type: 'error',
            message: `Workflow failed: ${error.message}`,
            error: error.message,
            timestamp: Date.now(),
          });

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Execute API error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Execution failed',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

