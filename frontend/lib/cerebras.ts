import { createCerebras } from '@ai-sdk/cerebras';
import { generateText } from 'ai';

/**
 * Generates content using Cerebras AI with Llama model
 * @param prompt - The prompt for content generation
 * @returns Generated text
 */
export async function generateContent(prompt: string): Promise<string> {
  try {
    const apiKey = process.env.CEREBRAS_API_KEY;
    
    if (!apiKey) {
      throw new Error('CEREBRAS_API_KEY not configured');
    }

    const cerebras = createCerebras({ apiKey });

    const { text } = await generateText({
      model: cerebras('llama-4-scout-17b-16e-instruct'),
      prompt: prompt,
    });

    return text;
  } catch (error: any) {
    console.error('Cerebras generation error:', error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

/**
 * Parses natural language into workflow JSON using Cerebras
 * @param input - Natural language workflow description
 * @returns Parsed workflow structure
 */
export async function parseWorkflow(input: string): Promise<any> {
  try {
    const apiKey = process.env.CEREBRAS_API_KEY;
    
    if (!apiKey) {
      throw new Error('CEREBRAS_API_KEY not configured');
    }

    const cerebras = createCerebras({ apiKey });

    const prompt = `You are a workflow parser. Convert the following natural language command into a JSON workflow structure.

STRICT MODE CONTRACT (read carefully):
- If the user message is clear small-talk with NO signs of workflow intent (no verbs like upload/add/create/analyze/summarize/fetch/search/gather/send), return the exact string: __OFF_TOPIC__
- If the instruction is ambiguous but contains workflow intent, prefer returning your best linear workflow guess rather than __OFF_TOPIC__.

The workflow should have this structure:
{
  "workflowId": "unique-id",
  "nodes": [
    {
      "id": "step-0",
      "type": "notion" | "notion_create" | "llm" | "email" | "tavily" | "web_search" | "github" | "file_upload" | "csv_upload" | "pdf_upload" | "txt_upload",
      "action": "fetch_page" | "fetch_database" | "create_page" | "append_to_page" | "summarize" | "analyze" | "extract_insights" | "custom_action_name" | "send" | "search_web" | "get_repos" | "get_issues" | "create_issue" | "upload_any" | "upload_csv" | "upload_pdf" | "upload_txt",
      "label": "Human readable label",
      "params": {}
    }
  ],
  "edges": [
    {
      "id": "edge-0",
      "source": "step-0",
      "target": "step-1"
    }
  ]
}

Node Types and Actions:
- "notion" - Fetch Notion pages/databases
  Actions: fetch_page, fetch_database
- "notion_create" - Create or update Notion content
  Actions: create_page, append_to_page
- "llm" - AI processing (summarize, analyze, extract data)
  Actions: summarize, analyze, extract_insights, or any custom snake_case action
- "email" - Send email results
  Actions: send
- "tavily" / "web_search" - Search the web for current information
  Actions: search_web (params: {query: "search query"})
- "github" - GitHub repository operations (supports URLs and username defaults to HoneyPaptan)
  Actions: 
  * get_repos (params: {username?, url?}) - defaults to HoneyPaptan if no username/URL
  * get_issues (params: {}) - repository will be provided by user configuration
  * create_issue (params: {title?}) - repository will be provided by user configuration
- "file_upload" - Upload any file type (CSV, PDF, TXT)
  Actions: upload_any
- "csv_upload" - Upload CSV files specifically
  Actions: upload_csv
- "pdf_upload" - Upload PDF files specifically
  Actions: upload_pdf
- "txt_upload" - Upload text files specifically
  Actions: upload_txt

Rules:
- Use "tavily" or "web_search" when user mentions searching the web, finding current information, or real-time data
- Use "github" when user mentions GitHub repositories, issues, or code:
  * For get_repos: defaults to username "HoneyPaptan" unless user specifies another user/URL
  * For get_issues/create_issue: DO NOT include repo_url in params, user will provide via configuration
  * Examples: "my GitHub repos", "issues from my project", "create issue in my repository"
- Use "notion_create" when user wants to CREATE or SAVE data back to Notion (will use default database)
- Use "notion" only for READING/FETCHING Notion data
- Use "llm" for any AI processing, analysis, or transformation
- Use file upload nodes when user mentions uploading files:
  * "csv_upload" when user specifically mentions "CSV", "spreadsheet", "comma-separated", or "data file"
  * "pdf_upload" when user specifically mentions "PDF", "document", or "PDF file"
  * "txt_upload" when user specifically mentions "text file", "TXT", or "plain text"
  * "file_upload" when user mentions "upload file" without specifying type, or mentions multiple file types
  * Examples: "upload my CSV data", "process this PDF", "analyze my text file", "upload a file"
- When inserting a node AFTER another, REWIRE EDGES: remove previous targets of the source and connect source → new_node → former_target(s) unless user says "in parallel".
- Never leave stray edges from an upload node to unrelated existing nodes (e.g., MCQ). Connect only to the explicitly mentioned next node.
- Generate descriptive labels for each node
- For "notion_create" nodes, the system will automatically use the user's configured default database

CRITICAL - Edge Structure for Parallel Execution:
When user says "at the same time", "parallel", "simultaneously", "both":
- Create edges from the SAME source to MULTIPLE targets
- Example: "fetch page, then summarize and extract date at the same time"
  Edges: [
    {"id": "edge-0", "source": "step-0", "target": "step-1"},  // fetch → summarize
    {"id": "edge-1", "source": "step-0", "target": "step-2"}   // fetch → extract (parallel!)
  ]
  
WRONG (sequential):
  step-0 → step-1 → step-2  ❌
  Edges: [edge-0: 0→1, edge-1: 1→2]

CORRECT (parallel):
       ┌→ step-1 ┐
  step-0         → step-3  ✅
       └→ step-2 ┘
  Edges: [edge-0: 0→1, edge-1: 0→2, edge-2: 1→3, edge-3: 2→3]

If NO parallel keywords: Create sequential edges (0→1→2)

User command: ${input}

Return ONLY the JSON, or the sentinel __OFF_TOPIC__ with no extra text.`;

    const { text } = await generateText({
      model: cerebras('llama-4-scout-17b-16e-instruct'),
      prompt: prompt,
    });

    // Off-topic sentinel handling
    if (text.includes('__OFF_TOPIC__')) {
      throw new Error('I can help build workflows. Try: "Upload a file and gather information" or "Add a gather information step after upload".');
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Cerebras response did not contain JSON:', text);
      throw new Error('Could not generate a valid workflow from your command. Please try rephrasing or being more specific.');
    }

    let workflow;
    try {
      workflow = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Cerebras JSON:', jsonMatch[0]);
      throw new Error('Generated workflow structure is invalid. Please try again with a clearer command.');
    }
    
    // Validate workflow structure
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      throw new Error('Invalid workflow structure: missing nodes array');
    }

    console.log('🧠 Cerebras generated workflow:');
    console.log('   Nodes:', workflow.nodes.map((n: any) => `${n.id} (${n.label})`).join(', '));
    console.log('   Edges:', JSON.stringify(workflow.edges, null, 2));

    return workflow;
  } catch (error: any) {
    console.error('Workflow parsing error:', error);
    throw new Error(`Failed to parse workflow: ${error.message}`);
  }
}

