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
      <DialogContent className="sm:max-w-[425px] bg-black border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">Workflow Configuration</DialogTitle>
          <DialogDescription className="text-white/70">
            Enter the required information to run this workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {needsNotion && (
            <div className="grid gap-2">
              <Label htmlFor="notionPageId" className="text-white">Notion ID (Page or Database)</Label>
              <Input
                id="notionPageId"
                placeholder="e.g., 27e6ddfc5f1680228444ed4170ded29e"
                value={config.notionPageId}
                onChange={(e) =>
                  setConfig({ ...config, notionPageId: e.target.value })
                }
                className="bg-black border-white/20 text-white font-mono text-sm"
              />
              <p className="text-xs text-white/60">
                32-character ID (with or without dashes). System auto-detects if it's a page or database.
              </p>
              <p className="text-xs text-white/80">
                Example: notion.so/meeting-notes-<span className="font-bold">27e6ddfc5f1680228444ed4170ded29e</span>
              </p>
            </div>
          )}

          {needsNotionCreate && (
            <div className="grid gap-2">
              <div className="p-3 bg-black/50 border border-white/20 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <Label className="text-white font-medium">Notion Page Creation</Label>
                </div>
                <p className="text-xs text-white/80">
                  ✅ Default database configured - pages will be created automatically
                </p>
                <p className="text-xs text-white/60 mt-1">
                  Optional: Override with a specific page or database ID above
                </p>
              </div>
            </div>
          )}

          {needsGitHub && (
            <div className="grid gap-2">
              <Label htmlFor="githubRepoUrl" className="text-white">GitHub Repository</Label>
              <Input
                id="githubRepoUrl"
                placeholder="e.g., HoneyPaptan/my-repo or https://github.com/owner/repo"
                value={config.githubRepoUrl}
                onChange={(e) =>
                  setConfig({ ...config, githubRepoUrl: e.target.value })
                }
                className="bg-black border-white/20 text-white font-mono text-sm"
              />
              <p className="text-xs text-white/60">
                Repository URL or owner/repo format for GitHub operations.
              </p>
              <p className="text-xs text-white/80">
                Examples: <span className="font-bold">owner/repo</span> or full GitHub URL
              </p>
            </div>
          )}

          {needsEmail && (
            <div className="grid gap-2">
              <Label htmlFor="recipientEmail" className="text-white">Recipient Email</Label>
              <Input
                id="recipientEmail"
                type="email"
                placeholder="e.g., you@example.com"
                value={config.recipientEmail}
                onChange={(e) =>
                  setConfig({ ...config, recipientEmail: e.target.value })
                }
                className="bg-black border-white/20 text-white"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/20 text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-white text-black hover:bg-white/90">Run Workflow</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

