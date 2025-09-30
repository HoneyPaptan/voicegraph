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

The workflow should have this structure:
{
  "workflowId": "unique-id",
  "nodes": [
    {
      "id": "step-0",
      "type": "notion" | "llm" | "email",
      "action": "fetch_page" | "fetch_database" | "summarize" | "analyze" | "extract_insights" | "send",
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

Rules:
- Create a LINEAR workflow (no branching)
- Use "notion" type for fetching Notion pages/databases
- Use "llm" type for summarizing, analyzing, or extracting insights
- Use "email" type for sending results
- Connect nodes sequentially with edges
- Generate descriptive labels for each node

User command: ${input}

Return ONLY the JSON, no explanations.`;

    const { text } = await generateText({
      model: cerebras('llama-4-scout-17b-16e-instruct'),
      prompt: prompt,
    });

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    const workflow = JSON.parse(jsonMatch[0]);
    
    // Validate workflow structure
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      throw new Error('Invalid workflow structure: missing nodes array');
    }

    return workflow;
  } catch (error: any) {
    console.error('Workflow parsing error:', error);
    throw new Error(`Failed to parse workflow: ${error.message}`);
  }
}

