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
    notionDatabaseId: '',
    recipientEmail: '',
  });

  const handleSubmit = () => {
    onSubmit(config);
    onClose();
  };

  // Determine which fields are needed based on workflow nodes
  const needsNotionPage = workflowNodes.some(
    (n) => n.type === 'notion' && n.action === 'fetch_page'
  );
  const needsNotionDatabase = workflowNodes.some(
    (n) => n.type === 'notion' && n.action === 'fetch_database'
  );
  const needsEmail = workflowNodes.some((n) => n.type === 'email');

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
          {needsNotionPage && (
            <div className="grid gap-2">
              <Label htmlFor="notionPageId">Notion Page ID</Label>
              <Input
                id="notionPageId"
                placeholder="e.g., 1234567890abcdef1234567890abcdef"
                value={config.notionPageId}
                onChange={(e) =>
                  setConfig({ ...config, notionPageId: e.target.value })
                }
                className="bg-gray-800 border-gray-700 font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Must be a 32-character UUID without dashes. Found in page URL after notion.so/
              </p>
              <p className="text-xs text-yellow-500">
                Example: notion.so/YourPageName-<span className="font-bold">1234567890abcdef1234567890abcdef</span>
              </p>
            </div>
          )}

          {needsNotionDatabase && (
            <div className="grid gap-2">
              <Label htmlFor="notionDatabaseId">Notion Database ID</Label>
              <Input
                id="notionDatabaseId"
                placeholder="e.g., abcdef1234567890abcdef1234567890"
                value={config.notionDatabaseId}
                onChange={(e) =>
                  setConfig({ ...config, notionDatabaseId: e.target.value })
                }
                className="bg-gray-800 border-gray-700 font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Must be a 32-character UUID without dashes. Found in database URL
              </p>
              <p className="text-xs text-yellow-500">
                Example: notion.so/<span className="font-bold">abcdef1234567890abcdef1234567890</span>?v=...
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

