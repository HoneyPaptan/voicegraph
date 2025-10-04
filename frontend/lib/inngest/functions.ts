import { inngest } from './client';
import { executeNode } from '../executor';
import { analyzeParallelWorkflow } from '../parallel-executor';
import { ExecutionContext, WorkflowNode, WorkflowEdge } from '../types';
import { workflowHistory } from '../workflow-history';

/**
 * Inngest function to execute workflows in the background
 * Uses steps for reliability and automatic retries
 */
export const executeWorkflowFunction = inngest.createFunction(
  { 
    id: 'execute-workflow',
    name: 'Execute VoiceGraph Workflow',
    // Disable retries: if any step throws, the function fails immediately
    retries: 0,
  },
  { event: 'workflow/execute.requested' },
  async ({ event, step }) => {
    console.log(`🎯 Inngest function triggered with event:`, event);
    
    const { 
      workflowId, 
      workflow, 
      config 
    } = event.data;

    console.log(`🚀 Starting Inngest workflow execution: ${workflowId}`);

    // Reload history to sync with other processes
    workflowHistory.reload();
    
    // Ensure workflow exists in history before proceeding
    const existingWorkflow = workflowHistory.get(workflowId);
    if (!existingWorkflow) {
      console.log(`⚠️ Workflow ${workflowId} not found in history, creating it...`);
      workflowHistory.create(workflowId, workflow, config, event.data.transcribedText);
    }

    // Update workflow status to running
    workflowHistory.updateStatus(workflowId, 'running');

    try {
      // Step 1: Initialize execution context
      const context: ExecutionContext = await step.run('initialize-context', async () => {
        return {
          ...config, // Include all config fields
          notionPageId: config.notionPageId,
          notionDatabaseId: config.notionDatabaseId,
          recipientEmail: config.recipientEmail,
          githubRepoUrl: config.githubRepoUrl,
          outputs: {},
          lastOutput: undefined,
          sourceContent: undefined,
        };
      });

      // Step 2: Analyze parallel structure
      const layers = await step.run('analyze-workflow', async () => {
        return analyzeParallelWorkflow(workflow.nodes, workflow.edges);
      });

      console.log(`📊 Workflow has ${layers.length} execution layer(s)`);

      // Step 3: Execute nodes layer by layer
      for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
        const layer = layers[layerIndex];
        
        const layerResults = await step.run(`execute-layer-${layerIndex}`, async (): Promise<Array<{ node: WorkflowNode; result: any; success: boolean }>> => {
          console.log(`⚡ Layer ${layerIndex}: Executing ${layer.nodes.length} node(s) in parallel`);

          // Execute all nodes in this layer in parallel
          const results = await Promise.all(
            layer.nodes.map(async (node) => {
              try {
                workflowHistory.addLog(workflowId, {
                  type: 'progress',
                  nodeId: node.id,
                  message: `Executing ${node.label || node.type}...`,
                  timestamp: Date.now(),
                });
              } catch (logError) {
                console.warn(`⚠️ Failed to add progress log for workflow ${workflowId}:`, logError);
              }

              // Convert serialized File objects back to proper File objects if needed
              const processedNode = {
                ...node,
                uploadedFile: node.uploadedFile ? new File(
                  [''], // Empty content since we can't reconstruct the original file
                  node.uploadedFile.name,
                  { type: node.uploadedFile.type }
                ) : undefined
              };
              
              const result = await executeNode(processedNode, context);

              if (result.success && 'output' in result) {
                try {
                  workflowHistory.addLog(workflowId, {
                    type: 'success',
                    nodeId: node.id,
                    message: `✓ ${node.label || node.type} completed`,
                    timestamp: Date.now(),
                  });
                } catch (logError) {
                  console.warn(`⚠️ Failed to add success log for workflow ${workflowId}:`, logError);
                }
                
                return { node: processedNode, result, success: true };
              } else {
                const errorMsg = result.error || 'Unknown error';
                try {
                  workflowHistory.addLog(workflowId, {
                    type: 'error',
                    nodeId: node.id,
                    message: `✗ ${errorMsg}`,
                    timestamp: Date.now(),
                  });
                } catch (logError) {
                  console.warn(`⚠️ Failed to add error log for workflow ${workflowId}:`, logError);
                }
                throw new Error(errorMsg);
              }
            })
          );

          return results;
        });
        
        // Update context with results from this layer
        const layerOutputs: string[] = [];
        
        for (const item of layerResults as any[]) {
          const { node, result } = item;
          if (result.success && 'output' in result) {
            context.outputs[node.id] = result.output;
            
            // Collect output for combining
            layerOutputs.push(result.output);

            // Store source content from source nodes (Notion, Tavily, GitHub)
            if (node.type === 'notion' || node.type === 'tavily' || node.type === 'web_search' || node.type === 'github') {
              if (!context.sourceContent) {
                context.sourceContent = result.output;
              } else {
                // Combine multiple sources
                context.sourceContent += '\n\n---\n\n' + result.output;
              }
            }
          }
        }
        
        // Combine outputs from parallel nodes
        if (layerOutputs.length > 0) {
          if (layerOutputs.length === 1) {
            // Single node in layer
            context.lastOutput = layerOutputs[0];
          } else {
            // Multiple parallel nodes - combine all outputs
            console.log(`🔄 Combining ${layerOutputs.length} parallel outputs`);
            context.lastOutput = layerOutputs
              .map((output, idx) => `## Result ${idx + 1}\n\n${output}`)
              .join('\n\n---\n\n');
          }
        }
      }

      // Step 4: Mark workflow as completed
      await step.run('finalize-workflow', async () => {
        console.log(`🔄 Updating workflow ${workflowId} status to completed`);
        try {
          workflowHistory.updateStatus(workflowId, 'completed');
          workflowHistory.addLog(workflowId, {
            type: 'success',
            nodeId: 'system',
            message: '✅ Workflow completed successfully',
            timestamp: Date.now(),
          });
          console.log(`✅ Workflow ${workflowId} completed successfully and status updated`);
        } catch (historyError) {
          console.warn(`⚠️ Failed to update workflow history for ${workflowId}:`, historyError);
        }
        return { success: true };
      });

      return { 
        success: true, 
        workflowId,
        message: 'Workflow executed successfully' 
      };

    } catch (error: any) {
      console.error(`❌ Workflow ${workflowId} failed:`, error);
      
      // Mark workflow as failed
      await step.run('mark-failed', async () => {
        try {
          workflowHistory.updateStatus(workflowId, 'failed', error.message);
        } catch (historyError) {
          console.warn(`⚠️ Failed to update workflow history for ${workflowId}:`, historyError);
        }
        return { success: false };
      });

      throw error;
    }
  }
);

