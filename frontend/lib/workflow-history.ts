import { Workflow, ExecutionLog } from './types';

/**
 * In-memory workflow history store
 * In production, this would be replaced with a database
 */

export interface WorkflowRun {
  id: string;
  workflow: Workflow;
  config: Record<string, string>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  logs: ExecutionLog[];
  startTime: Date;
  endTime?: Date;
  error?: string;
  transcribedText?: string;
}

class WorkflowHistory {
  private history: Map<string, WorkflowRun> = new Map();

  /**
   * Create a new workflow run
   */
  create(
    id: string, 
    workflow: Workflow, 
    config: Record<string, string>,
    transcribedText?: string
  ): WorkflowRun {
    const run: WorkflowRun = {
      id,
      workflow,
      config,
      status: 'pending',
      logs: [],
      startTime: new Date(),
      transcribedText,
    };
    
    this.history.set(id, run);
    console.log(`📝 Created workflow run: ${id}`);
    return run;
  }

  /**
   * Update workflow status
   */
  updateStatus(
    id: string, 
    status: WorkflowRun['status'],
    error?: string
  ): void {
    const run = this.history.get(id);
    if (run) {
      // Don't allow status to revert from terminal states
      if ((run.status === 'completed' || run.status === 'failed') && 
          (status === 'running' || status === 'pending')) {
        console.log(`⚠️ Prevented status revert from ${run.status} to ${status} for workflow ${id}`);
        return;
      }
      
      const oldStatus = run.status;
      run.status = status;
      if (status === 'completed' || status === 'failed') {
        run.endTime = new Date();
      }
      if (error) {
        run.error = error;
      }
      console.log(`🔄 Updated workflow ${id} status: ${oldStatus} → ${status}`);
    } else {
      console.log(`❌ Workflow ${id} not found in history when trying to update status to ${status}`);
    }
  }

  /**
   * Add a log entry to a workflow run
   */
  addLog(id: string, log: ExecutionLog): void {
    const run = this.history.get(id);
    if (run) {
      run.logs.push(log);
    }
  }

  /**
   * Get a specific workflow run
   */
  get(id: string): WorkflowRun | undefined {
    return this.history.get(id);
  }

  /**
   * Get all workflow runs (sorted by most recent first)
   */
  getAll(): WorkflowRun[] {
    return Array.from(this.history.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  /**
   * Clear all history (for testing)
   */
  clear(): void {
    this.history.clear();
    console.log('🗑️ Cleared workflow history');
  }
}

export const workflowHistory = new WorkflowHistory();

