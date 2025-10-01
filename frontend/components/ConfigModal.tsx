'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (config: Record<string, string>) => void;
  workflowNodes: any[];
}

/**
 * ConfigModal - Collects user configuration before workflow execution
 */
export function ConfigModal({ open, onClose, onSubmit, workflowNodes }: ConfigModalProps) {
  const [config, setConfig] = useState<Record<string, string>>({
    notionPageId: '',
    recipientEmail: '',
    githubRepoUrl: '',
  });

  const handleSubmit = () => {
    onSubmit(config);
    onClose();
  };

  // Determine which fields are needed based on workflow nodes
  const needsNotion = workflowNodes.some((n) => n.type === 'notion');
  const needsNotionCreate = workflowNodes.some((n) => n.type === 'notion_create');
  const needsEmail = workflowNodes.some((n) => n.type === 'email');
  const needsGitHub = workflowNodes.some((n) => 
    n.type === 'github' && 
    (n.action === 'get_issues' || n.action === 'fetch_issues' || n.action === 'create_issue')
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle>Workflow Configuration</DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter the required information to run this workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {needsNotion && (
            <div className="grid gap-2">
              <Label htmlFor="notionPageId">Notion ID (Page or Database)</Label>
              <Input
                id="notionPageId"
                placeholder="e.g., 27e6ddfc5f1680228444ed4170ded29e"
                value={config.notionPageId}
                onChange={(e) =>
                  setConfig({ ...config, notionPageId: e.target.value })
                }
                className="bg-gray-800 border-gray-700 font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                32-character ID (with or without dashes). System auto-detects if it's a page or database.
              </p>
              <p className="text-xs text-yellow-500">
                Example: notion.so/meeting-notes-<span className="font-bold">27e6ddfc5f1680228444ed4170ded29e</span>
              </p>
            </div>
          )}

          {needsNotionCreate && (
            <div className="grid gap-2">
              <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <Label className="text-blue-300 font-medium">Notion Page Creation</Label>
                </div>
                <p className="text-xs text-blue-200">
                  ✅ Default database configured - pages will be created automatically
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Optional: Override with a specific page or database ID above
                </p>
              </div>
            </div>
          )}

          {needsGitHub && (
            <div className="grid gap-2">
              <Label htmlFor="githubRepoUrl">GitHub Repository</Label>
              <Input
                id="githubRepoUrl"
                placeholder="e.g., HoneyPaptan/my-repo or https://github.com/owner/repo"
                value={config.githubRepoUrl}
                onChange={(e) =>
                  setConfig({ ...config, githubRepoUrl: e.target.value })
                }
                className="bg-gray-800 border-gray-700 font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Repository URL or owner/repo format for GitHub operations.
              </p>
              <p className="text-xs text-yellow-500">
                Examples: <span className="font-bold">owner/repo</span> or full GitHub URL
              </p>
            </div>
          )}

          {needsEmail && (
            <div className="grid gap-2">
              <Label htmlFor="recipientEmail">Recipient Email</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="e.g., you@example.com"
                value={config.recipientEmail}
                onChange={(e) =>
                  setConfig({ ...config, recipientEmail: e.target.value })
                }
                className="bg-gray-800 border-gray-700"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Run Workflow</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

