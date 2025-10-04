import { Workflow, ExecutionLog } from './types';
import fs from 'fs';
import path from 'path';

/**
 * File-based workflow history store
 * Uses JSON files to persist data between processes
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
  private historyDir: string;
  private historyFile: string;

  constructor() {
    this.historyDir = path.join(process.cwd(), '.workflow-history');
    this.historyFile = path.join(this.historyDir, 'history.json');
    
    // Ensure directory exists
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true });
    }
    
    // Load existing history
    this.loadHistory();
  }

  private loadHistory() {
    try {
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, 'utf8');
        const historyData = JSON.parse(data);
        
        // Convert date strings back to Date objects
        const processedHistory = new Map();
        for (const [id, run] of Object.entries(historyData)) {
          const processedRun = {
            ...run,
            startTime: new Date(run.startTime),
            endTime: run.endTime ? new Date(run.endTime) : undefined
          };
          processedHistory.set(id, processedRun);
        }
        
        this.history = processedHistory;
        console.log(`📚 Loaded ${this.history.size} workflow runs from history file`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load workflow history:', error);
    }
  }

  private saveHistory() {
    try {
      const historyData = Object.fromEntries(this.history);
      fs.writeFileSync(this.historyFile, JSON.stringify(historyData, null, 2));
    } catch (error) {
      console.warn('⚠️ Failed to save workflow history:', error);
    }
  }

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
    this.saveHistory();
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
      this.saveHistory();
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
      this.saveHistory();
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
      .filter(run => run.startTime instanceof Date) // Filter out any corrupted entries
      .sort((a, b) => {
        try {
          return b.startTime.getTime() - a.startTime.getTime();
        } catch (error) {
          console.warn('⚠️ Error sorting workflow runs:', error);
          return 0; // Keep original order if sorting fails
        }
      });
  }

  /**
   * Clear all history (for testing)
   */
  clear(): void {
    this.history.clear();
    this.saveHistory();
    console.log('🗑️ Cleared workflow history');
  }

  /**
   * Reload history from disk (useful for syncing between processes)
   */
  reload(): void {
    this.loadHistory();
  }

  /**
   * Clean up corrupted history entries
   */
  cleanup(): void {
    const validEntries = new Map();
    let cleanedCount = 0;
    
    for (const [id, run] of this.history.entries()) {
      if (run.startTime instanceof Date) {
        validEntries.set(id, run);
      } else {
        cleanedCount++;
        console.warn(`🧹 Removed corrupted workflow entry: ${id}`);
      }
    }
    
    if (cleanedCount > 0) {
      this.history = validEntries;
      this.saveHistory();
      console.log(`🧹 Cleaned up ${cleanedCount} corrupted workflow entries`);
    }
  }
}

export const workflowHistory = new WorkflowHistory();

