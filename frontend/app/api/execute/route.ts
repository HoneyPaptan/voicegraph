import { NextRequest } from 'next/server';
import { executeNode } from '@/lib/executor';
import { WorkflowNode, ExecutionContext, WorkflowEdge } from '@/lib/types';
import { analyzeParallelWorkflow } from '@/lib/parallel-executor';

/**
 * POST /api/execute
 * Executes workflow nodes sequentially with Server-Sent Events streaming
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const { nodes, edges, config } = await request.json();

    if (!nodes || !Array.isArray(nodes)) {
      return new Response(
        JSON.stringify({ error: 'Invalid nodes array' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const workflowEdges: WorkflowEdge[] = edges || [];

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

          // Analyze workflow for parallel execution
          const layers = analyzeParallelWorkflow(nodes as WorkflowNode[], workflowEdges);
          
          console.log(`🚀 Executing workflow with ${layers.length} layer(s)`);
          
          // Execute layers sequentially, nodes within each layer in parallel
          for (const layer of layers) {
            console.log(`⚡ Layer ${layer.layer}: Executing ${layer.nodes.length} node(s) in parallel`);
            
            // Send progress events for all nodes in this layer
            layer.nodes.forEach(node => {
              sendEvent({
                type: 'progress',
                nodeId: node.id,
                message: `Executing ${node.label || node.type}...`,
                timestamp: Date.now(),
              });
            });
            
            // Execute all nodes in this layer concurrently
            const layerPromises = layer.nodes.map(async (node) => {
              try {
                const result = await executeNode(node, context);
                return { node, result };
              } catch (error: any) {
                return {
                  node,
                  result: {
                    success: false,
                    error: error.message || 'Unknown error',
                  },
                };
              }
            });
            
            // Wait for all nodes in layer to complete
            const layerResults = await Promise.all(layerPromises);
            
            // Process results and update context
            for (const { node, result } of layerResults) {
              if (result.success) {
                // Store output in context
                context[node.id] = result.output;
                
                // Update lastOutput with the result from this layer
                // If multiple nodes in layer, lastOutput will be the last one processed
                context.lastOutput = result.output;
                
                // Store source content from Notion for later LLM nodes to reference
                if (node.type === 'notion') {
                  // If multiple Notion nodes, store all of them
                  if (!context.sourceContent) {
                    context.sourceContent = result.output;
                  } else {
                    // Combine multiple sources
                    context.sourceContent += '\n\n---\n\n' + result.output;
                  }
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

