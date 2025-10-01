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
  });

  const handleSubmit = () => {
    onSubmit(config);
    onClose();
  };

  // Determine which fields are needed based on workflow nodes
  const needsNotion = workflowNodes.some((n) => n.type === 'notion');
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

