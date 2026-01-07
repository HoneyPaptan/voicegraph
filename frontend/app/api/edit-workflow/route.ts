import { NextRequest, NextResponse } from "next/server";
import { createCerebras } from "@ai-sdk/cerebras";
import { generateText } from "ai";
import { ensureWorkflowEdges } from "@/lib/workflow-utils";

/**
 * POST /api/edit-workflow
 * Parses voice commands to edit existing workflow using Cerebras
 */
export async function POST(request: NextRequest) {
  try {
    const { text, currentWorkflow } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Invalid input text" },
        { status: 400 },
      );
    }

    // Check if input is too short or just punctuation/whitespace
    const trimmedText = text.trim();
    if (trimmedText.length < 5 || /^[.\s,!?-]*$/.test(trimmedText)) {
      return NextResponse.json(
        {
          error:
            'Please provide a meaningful edit command. Try something like: "add a summarize step" or "extract date at the same time"',
        },
        { status: 400 },
      );
    }

    if (
      !currentWorkflow ||
      !currentWorkflow.nodes ||
      currentWorkflow.nodes.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "No existing workflow to edit. Please create a workflow first, then use voice edit to modify it.",
        },
        { status: 400 },
      );
    }

    console.log("Parsing workflow edit command:", text);
    console.log("Current workflow:", JSON.stringify(currentWorkflow, null, 2));

    const apiKey = process.env.CEREBRAS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "CEREBRAS_API_KEY not configured" },
        { status: 500 },
      );
    }

    const cerebras = createCerebras({ apiKey });

    // Analyze the current workflow structure for better context
    const analyzeWorkflow = (workflow: any) => {
      const nodes = workflow.nodes || [];
      const edges = workflow.edges || [];

      // Build flow structure
      const flowStructure = nodes.map((node: any, index: number) => {
        const incomingEdges = edges.filter((e: any) => e.target === node.id);
        const outgoingEdges = edges.filter((e: any) => e.source === node.id);
        const position = `${index + 1}${index === 0 ? " (first)" : index === nodes.length - 1 ? " (last)" : ""}`;

        return {
          id: node.id,
          position,
          type: node.type,
          action: node.action,
          label: node.label,
          role:
            index === 0
              ? "starting point"
              : index === nodes.length - 1
                ? "final step"
                : "processing step",
          incomingFrom: incomingEdges.map((e: any) => {
            const sourceNode = nodes.find((n: any) => n.id === e.source);
            return sourceNode ? sourceNode.label : e.source;
          }),
          outgoingTo: outgoingEdges.map((e: any) => {
            const targetNode = nodes.find((n: any) => n.id === e.target);
            return targetNode ? targetNode.label : e.target;
          }),
        };
      });

      return flowStructure;
    };

    const workflowAnalysis = analyzeWorkflow(currentWorkflow);
    const flowDescription = workflowAnalysis
      .map(
        (node: any) =>
          `${node.position}. ${node.label} (${node.type}-${node.action}) - ${node.role}${
            node.incomingFrom.length > 0
              ? ` ← receives from: [${node.incomingFrom.join(", ")}]`
              : ""
          }${
            node.outgoingTo.length > 0
              ? ` → sends to: [${node.outgoingTo.join(", ")}]`
              : ""
          }`,
      )
      .join("\n");

    const prompt = `You are an intelligent workflow editor AI with full context awareness. A user wants to modify their existing workflow using natural voice commands.

STRICT MODE CONTRACT:
- If the user message is clear small-talk with NO workflow intent, return the exact string: __OFF_TOPIC__
- If the message contains workflow intent but is ambiguous, prefer making the most reasonable edit rather than returning __OFF_TOPIC__
- When inserting a node AFTER another, REWIRE EDGES: connect source → new_node and new_node → former_target(s). Do not leave the old source → former_target edges in place unless user says "in parallel".

CURRENT WORKFLOW ANALYSIS:
${flowDescription}

CURRENT WORKFLOW DATA:
${JSON.stringify(currentWorkflow, null, 2)}

USER'S EDIT COMMAND: "${text}"

CONTEXT UNDERSTANDING RULES:
1. **Reference Resolution**:
   - "this node/step" = most recently mentioned or contextually relevant node
   - "the [type] node" = find the node by type (e.g., "the email node", "the summarize step")
   - "first/last node" = use position in flow
   - "remove the middle step" = identify the middle processing step

2. **Replacement Logic**:
   - When replacing a node, maintain ALL its current connections
   - Keep the same position in the workflow flow
   - Preserve the logical flow structure

3. **Addition Logic**:
   - "add [X] after [Y]" = insert between Y and Y's current target (rewire edges)
   - "add [X] before [Y]" = insert between Y's source and Y
   - "add [X] in parallel to [Y]" = create from same source as Y
   - "add [X]" (no position specified) = add at the most logical position

4. **Contextual Intelligence**:
   - If user says "make it faster", consider what would optimize the workflow
   - If user mentions specific functionality, map to appropriate node types
   - If user wants to "also do X", create parallel processing

AVAILABLE NODE TYPES & ACTIONS:
- notion: fetch_page, fetch_database, query_database
- notion_create: create_page
- llm: summarize, analyze, extract_insights, transform, generate, OR any custom action
- email: send
- tavily: search, search_news
- github: get_commits, get_repo_info, get_pull_requests
- file_upload: upload_any (for any file type)
- csv_upload: upload_csv (for CSV files specifically)
- pdf_upload: upload_pdf (for PDF files specifically)
- txt_upload: upload_txt (for text files specifically)

SMART EDITING BEHAVIORS:
1. **Node Replacement**: When replacing, copy the old node's position and connections exactly
2. **Flow Preservation**: Maintain the logical workflow structure unless explicitly changed
3. **Intelligent Insertion**: Place new nodes where they make the most sense in the flow
4. **Edge Management**: Automatically update all affected edges when nodes change
5. **ID Management**: Reuse IDs when replacing, generate new sequential IDs when adding

CRITICAL RULES:
- Preserve workflow.workflowId
- When removing nodes, update ALL affected edges
- When replacing nodes, maintain exact same connections but update the node content
- When adding nodes, insert at the most logical position in the flow
- Generate human-readable labels that describe the actual function
- For custom LLM actions, use descriptive snake_case names

PARALLEL PROCESSING KEYWORDS:
"at the same time", "parallel", "simultaneously", "also", "both", "together", "in addition to"
→ Create multiple edges FROM the same source TO different targets

Return ONLY the updated workflow JSON with no explanations, or the sentinel __OFF_TOPIC__.`;

    const { text: response } = await generateText({
      model: cerebras("qwen-3-32b"),
      prompt: prompt,
    });

    // Off-topic handling
    if (response.includes("__OFF_TOPIC__")) {
      return NextResponse.json(
        {
          error:
            'I can modify workflows based on your instructions. Try: "Add a gather information step after upload".',
        },
        { status: 400 },
      );
    }

    // Helper: robustly extract JSON from a possibly noisy response
    const extractJson = (text: string): any | null => {
      try {
        // 1) Prefer fenced code block
        const fenceMatch = text.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
        if (fenceMatch && fenceMatch[1]) {
          const fenced = fenceMatch[1].trim();
          return JSON.parse(fenced);
        }
        // 2) Try first balanced { ... } block
        const start = text.indexOf("{");
        if (start === -1) return null;
        let depth = 0;
        let inString = false;
        let escape = false;
        for (let i = start; i < text.length; i++) {
          const ch = text[i];
          if (inString) {
            if (escape) {
              escape = false;
            } else if (ch === "\\") {
              escape = true;
            } else if (ch === '"') {
              inString = false;
            }
          } else {
            if (ch === '"') inString = true;
            else if (ch === "{") depth++;
            else if (ch === "}") {
              depth--;
              if (depth === 0) {
                const candidate = text.slice(start, i + 1);
                return JSON.parse(candidate);
              }
            }
          }
        }
      } catch (e) {
        console.warn("Failed to parse JSON via robust extractor:", e);
      }
      return null;
    };

    const parsed = extractJson(response);
    if (!parsed) {
      console.error("Failed to extract JSON from response:", response);
      return NextResponse.json(
        {
          error:
            'Edit command understood, but I could not produce a clean workflow JSON. Please rephrase slightly (e.g., "Add a gather information step after file upload").',
        },
        { status: 400 },
      );
    }

    let updatedWorkflow = parsed;

    // Enhanced validation for edited workflows
    const validateEditedWorkflow = (workflow: any, originalWorkflow: any) => {
      // Basic structure validation
      if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
        throw new Error("Invalid workflow structure: missing nodes array");
      }

      if (!workflow.edges || !Array.isArray(workflow.edges)) {
        workflow.edges = [];
      }

      // Validate node structure
      if (workflow.nodes && Array.isArray(workflow.nodes)) {
        workflow.nodes.forEach((node: any, index: number) => {
          if (!node.id || !node.type || !node.action || !node.label) {
            throw new Error(
              `Invalid node structure at position ${index + 1}: missing required fields (id: ${node.id}, type: ${node.type}, action: ${node.action}, label: ${node.label})`,
            );
          }
        });
      }

      // Validate edges reference existing nodes
      const nodeIds = workflow.nodes.map((n: any) => n.id);
      workflow.edges.forEach((edge: any, index: number) => {
        if (!nodeIds.includes(edge.source) || !nodeIds.includes(edge.target)) {
          console.warn(
            `⚠️ Edge ${index + 1} references non-existent nodes: ${edge.source} → ${edge.target}`,
          );
        }
      });

      // Preserve workflow ID
      if (originalWorkflow.workflowId) {
        workflow.workflowId = originalWorkflow.workflowId;
      }

      // Ensure at least one node exists
      if (workflow.nodes.length === 0) {
        throw new Error(
          "Workflow cannot be empty - at least one node is required",
        );
      }

      return workflow;
    };

    updatedWorkflow = validateEditedWorkflow(updatedWorkflow, currentWorkflow);

    // Debug: Log what Cerebras generated
    console.log("🧠 Cerebras edited workflow:");
    console.log(
      "   Nodes:",
      updatedWorkflow.nodes.map((n: any) => `${n.id} (${n.label})`).join(", "),
    );
    console.log(
      "   Raw Edges:",
      JSON.stringify(updatedWorkflow.edges, null, 2),
    );

    // Ensure all nodes are connected with edges (only adds if missing)
    updatedWorkflow = ensureWorkflowEdges(updatedWorkflow);

    console.log(
      "   Final Edges:",
      JSON.stringify(updatedWorkflow.edges, null, 2),
    );

    return NextResponse.json({
      workflow: updatedWorkflow,
      success: true,
      message: "Workflow updated successfully",
    });
  } catch (error: any) {
    console.error("Workflow edit error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to edit workflow",
        details: error.toString(),
      },
      { status: 500 },
    );
  }
}
