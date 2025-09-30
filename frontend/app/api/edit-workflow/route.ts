import { NextRequest, NextResponse } from 'next/server';
import { createCerebras } from '@ai-sdk/cerebras';
import { generateText } from 'ai';
import { ensureWorkflowEdges } from '@/lib/workflow-utils';

/**
 * POST /api/edit-workflow
 * Parses voice commands to edit existing workflow using Cerebras
 */
export async function POST(request: NextRequest) {
  try {
    const { text, currentWorkflow } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input text' },
        { status: 400 }
      );
    }

    if (!currentWorkflow) {
      return NextResponse.json(
        { error: 'Current workflow not provided' },
        { status: 400 }
      );
    }

    console.log('Parsing workflow edit command:', text);
    console.log('Current workflow:', JSON.stringify(currentWorkflow, null, 2));

    const apiKey = process.env.CEREBRAS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'CEREBRAS_API_KEY not configured' },
        { status: 500 }
      );
    }

    const cerebras = createCerebras({ apiKey });

    const prompt = `You are a workflow editor AI. A user wants to modify their existing workflow using voice commands.

Current workflow:
${JSON.stringify(currentWorkflow, null, 2)}

User's edit command: "${text}"

Your task: Understand the user's intent and return the UPDATED workflow JSON.

Possible edit types:
1. ADD NODE - User wants to add a new step (e.g., "add a slack notification", "add another llm step")
2. REMOVE NODE - User wants to delete a step (e.g., "remove the email step", "delete the summarize node")
3. MODIFY NODE - User wants to change a step (e.g., "change the email to slack", "update the summary prompt")
4. REORDER - User wants to change the order (e.g., "move email to the end", "swap step 1 and 2")

Node Types & Actions:
- type: "notion" → actions: fetch_page, fetch_database
- type: "llm" → actions: summarize, analyze, extract_insights, OR any custom action in snake_case
  (e.g., extract_next_meeting_date, format_as_bullet_points, translate_to_spanish)
- type: "email" → action: send
- type: "slack" → action: send_message (if user requests)
- type: "webhook" → action: post (if user requests)

IMPORTANT Rules:
- Maintain the same JSON structure with workflowId, nodes, and edges
- Each node must have: id (step-N), type, action, label, params
- For LLM nodes with custom tasks, use a descriptive snake_case action name
- Generate new node IDs starting from the next available number
- Update edges to connect nodes sequentially in a linear flow
- If adding a node, insert it logically based on the command
- If removing a node, update all edges accordingly and renumber if needed
- Keep all existing nodes unless specifically asked to remove them
- Make labels human-readable and descriptive

Custom LLM Actions:
The executor can handle ANY action name for LLM nodes. Examples:
- extract_next_meeting_date
- find_action_items
- count_words
- translate_to_french
- format_as_json
Just use snake_case and be descriptive!

Return ONLY the updated workflow JSON, no explanations.`;

    const { text: response } = await generateText({
      model: cerebras('llama-4-scout-17b-16e-instruct'),
      prompt: prompt,
    });

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    let updatedWorkflow = JSON.parse(jsonMatch[0]);
    
    // Validate workflow structure
    if (!updatedWorkflow.nodes || !Array.isArray(updatedWorkflow.nodes)) {
      throw new Error('Invalid workflow structure: missing nodes array');
    }

    // Ensure all nodes are connected with edges
    updatedWorkflow = ensureWorkflowEdges(updatedWorkflow);

    console.log('Updated workflow:', JSON.stringify(updatedWorkflow, null, 2));

    return NextResponse.json({ 
      workflow: updatedWorkflow,
      success: true,
      message: 'Workflow updated successfully'
    });

  } catch (error: any) {
    console.error('Workflow edit error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to edit workflow',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

