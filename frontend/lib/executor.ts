import { WorkflowNode, ExecutionContext, NodeExecutionResult } from './types';
import { fetchNotion, fetchNotionPage, fetchNotionDatabase, createNotionPage, appendToNotionPage, createWorkflowResultsPage } from './tools/notion';
import { sendEmail } from './tools/email';
import { generateContent } from './cerebras';
import { searchWeb, extractWebData } from './tools/tavily';
import { getGitHubRepos, getGitHubIssues, createGitHubIssue } from './tools/github';
import { processUploadedFile, FileUploadResult } from './tools/file-upload';

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

      case 'notion_create':
        output = await executeNotionCreateNode(node, context);
        break;

      case 'llm':
        output = await executeLLMNode(node, context);
        break;

      case 'email':
        output = await executeEmailNode(node, context);
        break;

      case 'tavily':
      case 'web_search':
        output = await executeTavilyNode(node, context);
        break;

      case 'github':
        output = await executeGitHubNode(node, context);
        break;

      case 'file_upload':
      case 'csv_upload':
      case 'pdf_upload':
      case 'txt_upload':
        output = await executeFileUploadNode(node, context);
        break;

      case 'prompt':
        output = await executePromptNode(node, context);
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

/**
 * Executes a Notion Create node
 * Creates a new Notion page or appends to existing page
 */
async function executeNotionCreateNode(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<string> {
  const { action, params } = node;

  console.log(`📝 Notion Create node action: ${action}`);

  if (action === 'create_page') {
    // Try to get parent ID - prioritize user config, then env default, then null
    const parentId = context.notionDatabaseId || context.notionPageId || 
                    params?.databaseId || params?.pageId || params?.parentId || 
                    process.env.NOTION_PAGE_DEFAULT_ID || null;
    
    const title = params?.title || `Workflow Result - ${new Date().toLocaleString()}`;
    const content = context.lastOutput || '';

    console.log(`📝 Creating Notion page with parent: ${parentId || 'none (standalone)'}`);
    console.log(`📝 Using default database: ${process.env.NOTION_PAGE_DEFAULT_ID ? 'Yes' : 'No'}`);
    console.log(`📝 Title: "${title}"`);

    const result = await createNotionPage(parentId, title, content);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create Notion page');
    }

    return result.data || 'Page created successfully';
  } 
  else if (action === 'append_to_page') {
    const pageId = context.notionPageId || params?.pageId;
    const content = context.lastOutput || '';

    if (!pageId) {
      throw new Error('Notion Page ID not provided for appending content');
    }

    const result = await appendToNotionPage(pageId, content);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to append to Notion page');
    }

    return result.data || 'Content appended successfully';
  }
  else {
    throw new Error(`Unknown Notion create action: ${action}`);
  }
}

/**
 * Executes a Tavily Web Search node
 */
async function executeTavilyNode(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<string> {
  const { action, params } = node;

  console.log(`🔍 Tavily node action: ${action}`);

  // Build query with simple placeholder replacement from previous user input
  let query = params?.query || params?.search_query || '';
  const userInput = (context.lastOutput || context.sourceContent || '').toString();
  if (query.includes('{input}')) {
    query = query.replaceAll('{input}', userInput);
  } else if (query.includes('DESTINATION')) {
    query = query.replaceAll('DESTINATION', userInput);
  }
  if (!query) {
    query = userInput; // fallback to user input entirely
  }

  if (!query || query.trim().length === 0) {
    throw new Error('Search query not provided for Tavily search');
  }

  const maxResults = params?.max_results || params?.maxResults || 5;
  const includeDomains = params?.includeDomains || params?.include_domains;
  const site = params?.site;

  const result = await searchWeb(query, { maxResults, includeDomains, site });

  if (!result.success) {
    throw new Error(result.error || 'Web search failed');
  }

  // Concatenate with existing output so downstream summarization can see both routes and hotels
  const previous = context.lastOutput ? String(context.lastOutput) + '\n\n' : '';
  return previous + (result.data || '');
}

/**
 * Executes a GitHub node
 * Supports fetching repos, issues, and creating issues
 */
async function executeGitHubNode(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<string> {
  const { action, params } = node;

  console.log(`🐙 GitHub node action: ${action}`);
  console.log(`🔧 GitHub config - Repository URL: ${context.githubRepoUrl || 'NOT_SET'}`);

  if (action === 'get_repos' || action === 'fetch_repos') {
    const usernameOrUrl = params?.username || params?.owner || params?.url || params?.repo_url;
    const maxRepos = params?.max_repos || params?.maxRepos || 10;

    console.log(`📦 GitHub repos request - Username/URL: ${usernameOrUrl || 'default (HoneyPaptan)'}`);
    
    const result = await getGitHubRepos(usernameOrUrl, maxRepos);

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch GitHub repos');
    }

    return result.data || 'No repositories found';
  }
  else if (action === 'get_issues' || action === 'fetch_issues') {
    // Prioritize user configuration first, then workflow params
    let repoUrl = context.githubRepoUrl; // User's config comes first
    
    // Only use workflow params if no config provided
    if (!repoUrl) {
      repoUrl = params?.repo_url || params?.url;
      
      if (!repoUrl && params?.owner && params?.repo) {
        repoUrl = `${params.owner}/${params.repo}`;
      }
      
      if (!repoUrl && params?.repository) {
        repoUrl = params.repository;
      }
    }

    if (!repoUrl) {
      throw new Error('GitHub repository URL must be provided. Please enter it in the configuration modal or specify in workflow parameters. Examples: "owner/repo", "https://github.com/owner/repo"');
    }

    const state = (params?.state as 'open' | 'closed' | 'all') || 'open';
    const maxIssues = params?.max_issues || params?.maxIssues || 10;

    console.log(`🐛 GitHub issues request - Repository: ${repoUrl}, State: ${state}`);
    console.log(`📋 Repository source: ${context.githubRepoUrl === repoUrl ? 'USER_CONFIG' : 'WORKFLOW_PARAMS'}`);

    const result = await getGitHubIssues(repoUrl, state, maxIssues);

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch GitHub issues');
    }

    return result.data || 'No issues found';
  }
  else if (action === 'create_issue') {
    // Prioritize user configuration first, then workflow params
    let repoUrl = context.githubRepoUrl; // User's config comes first
    
    // Only use workflow params if no config provided
    if (!repoUrl) {
      repoUrl = params?.repo_url || params?.url;
      
      if (!repoUrl && params?.owner && params?.repo) {
        repoUrl = `${params.owner}/${params.repo}`;
      }
      
      if (!repoUrl && params?.repository) {
        repoUrl = params.repository;
      }
    }

    if (!repoUrl) {
      throw new Error('GitHub repository URL must be provided for issue creation. Please enter it in the configuration modal or specify in workflow parameters. Examples: "owner/repo", "https://github.com/owner/repo"');
    }

    const title = params?.title || `Workflow Result - ${new Date().toLocaleString()}`;
    const body = context.lastOutput || params?.body || 'This issue was created automatically by a workflow.';

    console.log(`✏️ GitHub issue creation - Repository: ${repoUrl}, Title: "${title}"`);
    console.log(`📋 Repository source: ${context.githubRepoUrl === repoUrl ? 'USER_CONFIG' : 'WORKFLOW_PARAMS'}`);

    const result = await createGitHubIssue(repoUrl, title, body);

    if (!result.success) {
      throw new Error(result.error || 'Failed to create GitHub issue');
    }

    return result.data || 'Issue created successfully';
  }
  else {
    throw new Error(`Unknown GitHub action: ${action}. Supported actions: get_repos, fetch_repos, get_issues, fetch_issues, create_issue`);
  }
}

/**
 * Executes a file upload node
 * Processes uploaded files and extracts text content
 */
async function executeFileUploadNode(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<string> {
  const { action, params } = node;
  
  console.log(`📁 File upload node execution - Action: ${action}`);
  console.log(`📁 Node data:`, { 
    hasFileContent: !!node.fileContent, 
    fileContentLength: node.fileContent?.length,
    hasUploadedFile: !!node.uploadedFile,
    params: Object.keys(params)
  });
  
  // Check if file was uploaded during workflow creation
  if (node.fileContent) {
    console.log(`📄 Using pre-uploaded file content (${node.fileContent.length} characters)`);
    
    // Store in context for downstream nodes
    if (!context.uploadedFiles) {
      context.uploadedFiles = {};
    }
    context.uploadedFiles[node.id] = {
      fileName: node.uploadedFile?.name || params.fileName || 'uploaded-file',
      content: node.fileContent,
      metadata: {
        nodeId: node.id,
        uploadedAt: new Date().toISOString(),
        fileType: params.fileType,
        fileSize: node.uploadedFile?.size,
      }
    };
    
    return node.fileContent;
  }
  
  // If no file content, this might be a configuration error
  throw new Error('No file uploaded for file upload node. Please upload a file first.');
}

/**
 * Executes a basic Prompt node
 * Seeds the pipeline with a user-provided instruction or starting text
 */
async function executePromptNode(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<string> {
  const text = node.params?.text || node.params?.prompt || '';
  if (!text || typeof text !== 'string') {
    throw new Error('Prompt text is required for this node.');
  }
  // Set lastOutput so downstream nodes can consume
  return text.trim();
}

