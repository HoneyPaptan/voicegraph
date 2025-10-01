import { WorkflowNode, ExecutionContext, NodeExecutionResult } from './types';
import { fetchNotion, fetchNotionPage, fetchNotionDatabase } from './tools/notion';
import { sendEmail } from './tools/email';
import { generateContent } from './cerebras';

/**
 * Executes a single workflow node
 * @param node - The workflow node to execute
 * @param context - The execution context from previous nodes
 * @returns Execution result with output
 */
export async function executeNode(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  try {
    console.log(`Executing node ${node.id} (${node.type}):`, node);

    let output: any;

    switch (node.type) {
      case 'notion':
        output = await executeNotionNode(node, context);
        break;

      case 'llm':
        output = await executeLLMNode(node, context);
        break;

      case 'email':
        output = await executeEmailNode(node, context);
        break;

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }

    return { success: true, output };
  } catch (error: any) {
    console.error(`Node ${node.id} execution error:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Executes a Notion node
 * Uses smart fetcher that auto-detects page vs database
 */
async function executeNotionNode(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<string> {
  const { action, params } = node;

  // Use smart fetcher for any action type (auto-detects page vs database)
  // Prioritize user config over workflow params
  const notionId = context.notionPageId || context.notionDatabaseId || 
                   params?.pageId || params?.databaseId;
  
  if (!notionId) {
    throw new Error('Notion Page/Database ID not provided. Please enter it in the configuration modal.');
  }

  console.log(`📄 Notion node action: ${action}, using smart fetcher for ID: ${notionId}`);
  
  // Smart fetcher automatically handles both pages and databases
  return await fetchNotion(notionId);
}

/**
 * Executes an LLM node using Cerebras
 * Handles any action dynamically by converting action name to prompt
 * 
 * IMPORTANT: Uses sourceContent (original data) for extraction tasks,
 * and lastOutput (previous step) for transformation tasks
 */
async function executeLLMNode(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<string> {
  const { action, params } = node;
  
  // Determine which content to use:
  // - For extraction/analysis: use ORIGINAL source content
  // - For summarization: use previous output (or source if first LLM)
  const isExtractionTask = action.includes('extract') || action.includes('find') || action.includes('get');
  const isAnalysisTask = action.includes('analyze') || action.includes('insights');
  
  // Use source content for extraction/analysis, otherwise use previous output
  const inputContent = (isExtractionTask || isAnalysisTask) 
    ? (context.sourceContent || context.lastOutput)
    : context.lastOutput;
  
  if (!inputContent) {
    throw new Error('No input data for LLM processing');
  }

  // Build highly specific prompt based on action
  let prompt = '';
  
  // Check if there's a custom prompt in params first
  if (params?.prompt) {
    prompt = `${params.prompt}\n\nContent:\n${inputContent}`;
  }
  // Handle predefined actions with VERY specific prompts
  else if (action === 'summarize') {
    prompt = `Create a concise, well-structured summary of the following content. Include key points, action items, and important dates.\n\nContent:\n${inputContent}`;
  } else if (action === 'analyze') {
    prompt = `Analyze the following content and provide key insights, trends, and recommendations.\n\nContent:\n${inputContent}`;
  } else if (action === 'extract_insights') {
    prompt = `Extract the most important insights, learnings, and takeaways from the following content.\n\nContent:\n${inputContent}`;
  }
  // Handle extraction tasks with specific instructions
  else if (action.includes('extract') || action.includes('find') || action.includes('get')) {
    // Convert action to instruction
    // e.g., "extract_next_meeting_date" -> "Extract the next meeting date"
    const humanReadableAction = action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    prompt = `${humanReadableAction} from the following content. Be specific and provide ONLY the requested information. If the information is not found, clearly state "Not found in the content".\n\nContent:\n${inputContent}`;
  }
  // Handle ANY other custom action dynamically
  else {
    const humanReadableAction = action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    prompt = `${humanReadableAction} from the following content:\n\nContent:\n${inputContent}`;
  }

  console.log(`🤖 LLM Node Action: ${action}`);
  console.log(`📝 Using: ${isExtractionTask || isAnalysisTask ? 'SOURCE' : 'PREVIOUS'} content`);
  console.log(`💬 Prompt: ${prompt.substring(0, 150)}...`);

  return await generateContent(prompt);
}

/**
 * Executes an Email node
 */
async function executeEmailNode(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<string> {
  const { params } = node;
  
  // Prioritize user config over workflow params
  const to = context.recipientEmail || params?.to;
  const subject = params?.subject || 'Workflow Result';
  const body = context.lastOutput || 'No content';

  if (!to) {
    throw new Error('Recipient email address not provided. Please enter it in the configuration modal.');
  }

  return await sendEmail(to, subject, body);
}

