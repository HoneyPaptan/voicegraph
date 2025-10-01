/**
 * Workflow node types
 */
export type NodeType = 'notion' | 'llm' | 'email';

/**
 * Workflow node definition
 */
export interface WorkflowNode {
  id: string;
  type: NodeType;
  action: string;
  params?: Record<string, any>;
  label?: string;
  position?: { x: number; y: number };
}

/**
 * Workflow edge definition
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

/**
 * Complete workflow structure
 */
export interface Workflow {
  workflowId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/**
 * Execution context passed between nodes
 */
export interface ExecutionContext {
  lastOutput?: string;
  sourceContent?: string; // Original content from Notion (for LLM extraction tasks)
  notionPageId?: string;
  notionDatabaseId?: string;
  recipientEmail?: string;
  [key: string]: any;
}

/**
 * Execution log entry
 */
export interface ExecutionLog {
  nodeId: string;
  type: 'info' | 'success' | 'error' | 'progress';
  message: string;
  timestamp: number;
}

/**
 * Node execution result
 */
export interface NodeExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
}

