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
        output = await createNotionPage(context, node);
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
 * Executes a Notion node using direct API
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
  
  // Handle different actions
  if (action === 'fetch_page' || action === 'fetch_database' || !action) {
    // Use smart fetcher that auto-detects page vs database
    const content = await fetchNotion(notionId);
    return content;
  } else if (action === 'append' || action === 'append_to_page') {
    // Append content to page
    const content = context.lastOutput || params?.content || '';
    const result = await appendToNotionPage(notionId, content);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to append to Notion page');
    }
    return result.data || 'Content appended successfully';
  } else {
    // Default: use smart fetcher
    const content = await fetchNotion(notionId);
    return content;
  }
}

/**
 * Executes a Tavily Web Search node using direct API
 */
async function executeTavilyNode(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<string> {
  const { action, params } = node;
  
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
  
  const maxResults = params?.max_results || params?.maxResults || 5;
  const includeDomains = params?.includeDomains || params?.include_domains;
  const site = params?.site;
  
  const result = await searchWeb(query, { maxResults, includeDomains, site });
  
  if (!result.success) {
    throw new Error(result.error || 'Web search failed');
  }
  
  console.log(`📝 Direct Tavily API result - Data length: ${result.data ? result.data.length : 0}`);
  return result.data || 'No results found';
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
 * Executes an Email node
 * Sends email with workflow results
 */
async function executeEmailNode(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<string> {
  const { action, params } = node;
  
  // Get recipient email - prioritize user config, then params, then throw error
  const to = context.recipientEmail || params?.to || params?.recipient || params?.email;
  
  if (!to || typeof to !== 'string') {
    throw new Error('Email recipient address is required. Please enter it in the configuration modal or specify in workflow parameters.');
  }
  
  // Get subject from params or use default
  const subject = params?.subject || `Workflow Result - ${new Date().toLocaleString()}`;
  
  // Get email body from previous node output or params
  const body = context.lastOutput || params?.body || params?.content || params?.message || 'This email was sent automatically by a workflow.';
  
  // Ensure body is a string
  const emailBody = typeof body === 'string' ? body : String(body || '');
  
  if (!emailBody || emailBody.trim().length === 0) {
    throw new Error('Email body is required. Make sure previous nodes in the workflow produce output.');
  }
  
  console.log(`📧 Sending email - To: ${to}, Subject: "${subject}"`);
  
  return await sendEmail(to, subject, emailBody);
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
    params: Object.keys(params || {})
  });
  
  // File upload node - process uploaded file content
    if (node.fileContent) {
      console.log(`📄 Using pre-uploaded file content (${node.fileContent.length} characters)`);
      
      // Store in context for downstream nodes
      if (!context.uploadedFiles) {
        context.uploadedFiles = {};
      }
      context.uploadedFiles[node.id] = {
        fileName: node.uploadedFile?.name || params?.fileName || 'uploaded-file',
        content: node.fileContent,
        metadata: {
          nodeId: node.id,
          uploadedAt: new Date().toISOString(),
          fileType: params?.fileType,
          fileSize: node.uploadedFile?.size,
        }
      };
      
      return node.fileContent;
    }
  
  // If no file content, this might be a configuration error
  throw new Error('No file uploaded for file upload node. Please upload a file first.');
}

/**
 * Executes an LLM node
 * Processes content using Cerebras AI
 */
async function executeLLMNode(
  node: WorkflowNode,
  context: ExecutionContext
): Promise<string> {
  const { action, params } = node;
  
  // Get the prompt from params or use a default based on action
  let prompt = params?.prompt || '';
  
  // Get input content from previous nodes
  const inputContent = context.lastOutput || context.sourceContent || '';
  
  // Build the full prompt based on action
  if (action === 'summarize') {
    prompt = prompt || 'Summarize the following content concisely:';
    prompt = `${prompt}\n\n${inputContent}`;
  } else if (action === 'analyze') {
    prompt = prompt || 'Analyze the following content:';
    prompt = `${prompt}\n\n${inputContent}`;
  } else if (action === 'extract_insights') {
    prompt = prompt || 'Extract key insights from the following content:';
    prompt = `${prompt}\n\n${inputContent}`;
  } else if (action === 'transform') {
    prompt = prompt || 'Transform the following content:';
    prompt = `${prompt}\n\n${inputContent}`;
  } else if (action === 'generate') {
    prompt = prompt || inputContent || 'Generate content based on the context.';
  } else {
    // Default: use prompt if provided, otherwise use input content
    prompt = prompt || inputContent || 'Process the following content:';
    if (inputContent && prompt !== inputContent) {
      prompt = `${prompt}\n\n${inputContent}`;
    }
  }
  
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('LLM node requires either a prompt parameter or input content from previous nodes.');
  }
  
  return await generateContent(prompt);
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

