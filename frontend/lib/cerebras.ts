import { createCerebras } from "@ai-sdk/cerebras";
import { generateText } from "ai";

/**
 * Generates content using Cerebras AI with Llama model
 * @param prompt - The prompt for content generation
 * @returns Generated text
 */
export async function generateContent(prompt: string): Promise<string> {
  try {
    const apiKey = process.env.CEREBRAS_API_KEY;

    if (!apiKey) {
      throw new Error("CEREBRAS_API_KEY not configured");
    }

    const cerebras = createCerebras({ apiKey });

    const resp = await generateText({
      model: cerebras("gpt-oss-120b"),
      prompt: prompt,
    });

    // DEBUG: print all metadata we receive from the API so we can derive tokens/cost
    try {
      console.log("🧾 Cerebras raw response (truncated text):", {
        finishReason: (resp as any)?.finishReason,
        usage: (resp as any)?.usage,
        provider: "cerebras",
        textPreview: (resp as any)?.text?.slice(0, 200),
      });
    } catch (e) {}

    return (resp as any)?.text as string;
  } catch (error: any) {
    console.error("Cerebras generation error:", error);
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
      throw new Error("CEREBRAS_API_KEY not configured");
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
      "type": "notion" | "notion_create" | "llm" | "email" | "tavily" | "github" | "file_upload" | "csv_upload" | "pdf_upload" | "txt_upload" | "prompt",
      "action": "fetch_page" | "fetch_database" | "query_database" | "create_page" | "append_to_page" | "summarize" | "analyze" | "extract_insights" | "transform" | "generate" | "send" | "search" | "search_news" | "get_repos" | "get_issues" | "create_issue" | "upload_any" | "upload_csv" | "upload_pdf" | "upload_txt" | "seed",
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

AUTHORIZED NODES AND ACTIONS ONLY:

DATA SOURCE NODES:
- "notion" - Fetch Notion pages/databases
  Actions: fetch_page (params: {pageId}), fetch_database (params: {databaseId}), query_database (params: {databaseId, filter?})

- "tavily" - Search web with Tavily
  Actions: search (params: {query, maxResults?}), search_news (params: {query, maxResults?})

- "github" - GitHub repository operations
  Actions: get_repos (params: {username?, url?}), get_issues (params: {}), create_issue (params: {title?})

- "file_upload" - Upload any file type
  Actions: upload_any

- "csv_upload" - Upload CSV files
  Actions: upload_csv

- "pdf_upload" - Upload PDF files
  Actions: upload_pdf

- "txt_upload" - Upload text files
  Actions: upload_txt

- "prompt" - Seed workflow with initial text
  Actions: seed (params: {text})

PROCESSING NODES:
- "llm" - AI processing with Cerebras
  Actions: summarize (params: {prompt?, maxLength?}), analyze (params: {prompt}), extract_insights (params: {prompt?}), transform (params: {prompt}), generate (params: {prompt})

OUTPUT NODES:
- "notion_create" - Create/update Notion content
  Actions: create_page (params: {parentId, title, content?}), append_to_page (params: {parentId, content?})

- "email" - Send emails via SMTP
  Actions: send (params: {to, subject, customMessage?})

RULES FOR NODE SELECTION:
- Use "tavily" for web search, current information, news, or real-time data
- Use "github" for repositories, issues, commits, or pull requests
- Use "notion" for reading/fetching Notion data only
- Use "notion_create" for creating/saving to Notion
- Use "llm" for any AI processing, analysis, summarization, transformation
- Use "email" for sending results or communications
- Use file upload nodes for file processing:
  * "csv_upload" for CSV/spreadsheet/data files
  * "pdf_upload" for PDF/documents
  * "txt_upload" for text files
  * "file_upload" for generic file uploads
- Use "prompt" for seeding workflows with initial instructions

FILE UPLOAD MAPPING:
- "upload my data" → csv_upload if user mentions CSV, otherwise file_upload
- "process this document" → pdf_upload if PDF, otherwise file_upload
- "analyze text file" → txt_upload if plain text, otherwise file_upload

PARAMETER GUIDELINES:
- Include required parameters for each action (see AUTHORIZED NODES section)
- Optional parameters can be omitted unless user specifies them
- Use descriptive parameter values based on user command
- For GitHub get_repos: default username "HoneyPaptan" if not specified

PARALLEL EXECUTION:
When user says "at the same time", "parallel", "simultaneously", "both":
- Create edges from SAME source to MULTIPLE targets
- Example: "fetch data, then summarize and analyze at same time"
  Nodes: [fetch, summarize, analyze]
  Edges: [{"id": "edge-0", "source": "step-0", "target": "step-1"}, {"id": "edge-1", "source": "step-0", "target": "step-2"}]

If NO parallel keywords: Create sequential edges (0→1→2)

User command: ${input}

Return ONLY the JSON, or the sentinel __OFF_TOPIC__ with no extra text.`;

    const { text } = await generateText({
      model: cerebras("gpt-oss-120b"),
      prompt: prompt,
    });

    // Off-topic sentinel handling
    if (text.includes("__OFF_TOPIC__")) {
      throw new Error(
        'I can help build workflows. Try: "Upload a file and gather information" or "Add a gather information step after upload".',
      );
    }

    // Enhanced debugging: Log raw response
    console.log("🔍 Raw Cerebras response (first 500 chars):", text.slice(0, 500));
    console.log("🔍 Full response length:", text.length);
    
    // Extract JSON from response with multiple strategies
    let extractedJson = null;
    let extractionMethod = "";
    
    // Strategy 1: Original regex method
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      extractedJson = jsonMatch[0];
      extractionMethod = "regex";
    }
    
    // Strategy 2: Look for JSON code blocks
    if (!extractedJson) {
      const codeBlockMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        extractedJson = codeBlockMatch[1];
        extractionMethod = "codeblock";
      }
    }
    
    // Strategy 3: Try parsing entire response as JSON
    if (!extractedJson) {
      try {
        JSON.parse(text.trim());
        extractedJson = text.trim();
        extractionMethod = "full";
      } catch (e) {
        // Not valid JSON, continue to error
      }
    }
    
    if (!extractedJson) {
      console.error("❌ No JSON found in Cerebras response. Full response:", text);
      throw new Error(
        "Could not generate a valid workflow from your command. Please try rephrasing or being more specific.",
      );
    }
    
    // Enhanced debugging: Log extracted JSON
    console.log("🔍 Extracted JSON (method: " + extractionMethod + "):", extractedJson.slice(0, 300));
    console.log("🔍 Extracted JSON length:", extractedJson.length);
    
    // Validate JSON structure before parsing
    const openBraces = (extractedJson.match(/\{/g) || []).length;
    const closeBraces = (extractedJson.match(/\}/g) || []).length;
    const openBrackets = (extractedJson.match(/\[/g) || []).length;
    const closeBrackets = (extractedJson.match(/\]/g) || []).length;
    
    console.log("🔍 JSON structure validation:", {
      openBraces,
      closeBraces,
      openBrackets,
      closeBrackets,
      balanced: openBraces === closeBraces && openBrackets === closeBrackets
    });
    
    let workflow;
    try {
      workflow = JSON.parse(extractedJson);
      console.log("✅ JSON parsing successful");
    } catch (parseError) {
      console.error("❌ Failed to parse Cerebras JSON:", extractedJson);
      console.error("❌ Parse error details:", parseError);
      throw new Error(
        "Generated workflow structure is invalid. Please try again with a clearer command.",
      );
    }

    // Validate workflow structure
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      throw new Error("Invalid workflow structure: missing nodes array");
    }

    // Validate workflow against AVAILABLE_NODES
    const availableNodes: string[] = [
      'notion', 'notion_create', 'llm', 'email', 'tavily', 'github',
      'file_upload', 'csv_upload', 'pdf_upload', 'txt_upload', 'prompt'
    ];
    
    const allowedActions: Record<string, string[]> = {
      'notion': ['fetch_page', 'fetch_database', 'query_database'],
      'notion_create': ['create_page', 'append_to_page'],
      'llm': ['summarize', 'analyze', 'extract_insights', 'transform', 'generate'],
      'email': ['send'],
      'tavily': ['search', 'search_news'],
      'github': ['get_repos', 'get_issues', 'create_issue'],
      'file_upload': ['upload_any'],
      'csv_upload': ['upload_csv'],
      'pdf_upload': ['upload_pdf'],
      'txt_upload': ['upload_txt'],
      'prompt': ['seed']
    };

    // Validate each node
    for (const node of workflow.nodes) {
      const nodeType = node.type as string;
      const nodeAction = node.action as string;
      
      if (!availableNodes.includes(nodeType)) {
        throw new Error(`Invalid node type: ${nodeType}. Available types: ${availableNodes.join(', ')}`);
      }
      
      const typeActions = allowedActions[nodeType];
      if (typeActions && !typeActions.includes(nodeAction)) {
        throw new Error(`Invalid action ${nodeAction} for node type ${nodeType}. Available actions: ${typeActions.join(', ')}`);
      }
    }

    console.log("🧠 Cerebras generated workflow:");
    console.log(
      "   Nodes:",
      workflow.nodes.map((n: any) => `${n.id} (${n.type}:${n.action})`).join(", "),
    );
    console.log("   Edges:", JSON.stringify(workflow.edges, null, 2));
    console.log("✅ Workflow validation passed");

    return workflow;
  } catch (error: any) {
    console.error("Workflow parsing error:", error);
    throw new Error(`Failed to parse workflow: ${error.message}`);
  }
}
