'use client';

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Database, Sparkles, Mail, Search, Github, FileEdit, Upload, FileText, FileSpreadsheet, FileImage, X, Plus } from 'lucide-react';

interface NodeLibraryItem {
  type: string;
  label: string;
  icon: React.ReactNode;
  actions: string[];
  description: string;
  color: string;
}

interface NodesLibraryProps {
  onAddNode: (type: string, action: string) => void;
  compact?: boolean;
}

const AVAILABLE_NODES: NodeLibraryItem[] = [
  {
    type: 'notion',
    label: 'Notion',
    icon: <Database className="w-5 h-5" />,
    description: 'Fetch and query Notion pages',
    color: '',
    actions: ['fetch_page', 'fetch_database', 'query_database'],
  },
  {
    type: 'notion_create',
    label: 'Notion Create',
    icon: <FileEdit className="w-5 h-5" />,
    description: 'Create new Notion pages',
    color: '',
    actions: ['create_page', 'append_to_page'],
  },
  {
    type: 'llm',
    label: 'AI Processing',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'Process with Cerebras AI',
    color: '',
    actions: ['summarize', 'analyze', 'extract_insights', 'transform', 'generate'],
  },
  {
    type: 'email',
    label: 'Email',
    icon: <Mail className="w-5 h-5" />,
    description: 'Send emails via SMTP',
    color: '',
    actions: ['send'],
  },
  {
    type: 'tavily',
    label: 'Web Search',
    icon: <Search className="w-5 h-5" />,
    description: 'Search the web with Tavily',
    color: '',
    actions: ['search', 'search_news'],
  },
  {
    type: 'github',
    label: 'GitHub',
    icon: <Github className="w-5 h-5" />,
    description: 'Get GitHub repository info',
    color: '',
    actions: ['get_repos', 'get_issues', 'create_issue'],
  },
  {
    type: 'file_upload',
    label: 'File Upload',
    icon: <Upload className="w-5 h-5" />,
    description: 'Upload any file type',
    color: '',
    actions: ['upload_any'],
  },
  {
    type: 'csv_upload',
    label: 'CSV Upload',
    icon: <FileSpreadsheet className="w-5 h-5" />,
    description: 'Upload CSV files',
    color: '',
    actions: ['upload_csv'],
  },
  {
    type: 'pdf_upload',
    label: 'PDF Upload',
    icon: <FileImage className="w-5 h-5" />,
    description: 'Upload PDF files',
    color: '',
    actions: ['upload_pdf'],
  },
  {
    type: 'txt_upload',
    label: 'TXT Upload',
    icon: <FileText className="w-5 h-5" />,
    description: 'Upload text files',
    color: '',
    actions: ['upload_txt'],
  },
  {
    type: 'prompt',
    label: 'Prompt',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'Seed with a starting instruction',
    color: '',
    actions: ['seed'],
  },
];

export function NodesLibrary({ onAddNode, compact = false }: NodesLibraryProps) {
  const [selectedNode, setSelectedNode] = useState<NodeLibraryItem | null>(null);

  const handleAddNode = (type: string, action: string) => {
    onAddNode(type, action);
    // Show success feedback
    console.log(`✅ Added ${type} node with action: ${action}`);
  };

  // Compact rendering used for inline panel
  if (compact) {
    return (
      <div className="space-y-2">
        {!selectedNode ? (
          <div className="grid grid-cols-1 gap-2">
            {AVAILABLE_NODES.map((node) => (
              <Button
                key={node.type}
                variant="outline"
                className="justify-start h-10 text-xs bg-black/50 border-white/20 hover:bg-white/10 text-white"
                onClick={() => setSelectedNode(node)}
              >
                <span className={`inline-flex items-center gap-2`}>
                  <span className="p-1 rounded bg-white/10 border border-white/15 text-white">{node.icon}</span>
                  {node.label}
                </span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNode(null)}
              className="text-xs justify-start h-9 px-2 text-white/80 hover:text-white hover:bg-white/10"
            >
              <span className="mr-1">←</span>
              Back to nodes
            </Button>
            {selectedNode.actions.map((action) => (
              <Button
                key={action}
                variant="outline"
                className="justify-between h-10 text-xs bg-black/50 border-white/20 hover:bg-white/10 text-white"
                onClick={() => handleAddNode(selectedNode.type, action)}
              >
                <span className="capitalize">{action.replace(/_/g, ' ')}</span>
                <Plus className="w-3 h-3 text-white" />
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default verbose rendering (used in sidebar sheet)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-white">Nodes Library</h3>
        <p className="text-xs text-white/70">Click to add nodes</p>
      </div>

      <div className="space-y-3">
        {!selectedNode ? (
          <div className="space-y-3">
            {AVAILABLE_NODES.map((node) => (
              <Card
                key={node.type}
                className="p-3 bg-black/50 border-white/20 hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setSelectedNode(node)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/10 border border-white/15 text-white">
                    {node.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-white">{node.label}</h4>
                    <p className="text-xs text-white/70 mt-1">{node.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-white/70">
                        {node.actions.length} actions
                      </span>
                      <span className="text-[10px] text-white/50">→ Click to view</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNode(null)}
              className="mb-3 text-xs text-white hover:bg-white/10"
            >
              ← Back to all nodes
            </Button>

            <div className="mb-3 p-3 bg-black/40 border border-white/15 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-white/10 border border-white/15 text-white">
                  {selectedNode.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">{selectedNode.label}</h4>
                  <p className="text-xs text-white/70">{selectedNode.description}</p>
                </div>
              </div>
            </div>

            <h4 className="text-xs font-semibold mb-2 text-white">Available Actions</h4>
            <div className="space-y-2">
              {selectedNode.actions.map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  className="w-full justify-between text-left h-auto py-2 px-3 bg-black/50 hover:bg-white/10 border-white/20 text-white"
                  onClick={() => handleAddNode(selectedNode.type, action)}
                >
                  <div>
                    <div className="font-medium text-xs capitalize">
                      {action.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[10px] text-white/60 mt-0.5">
                      Click to add to canvas
                    </div>
                  </div>
                  <Plus className="w-3 h-3 text-white" />
                </Button>
              ))}
            </div>

            <div className="mt-3 p-2 bg-white/10 border border-white/20 rounded-lg">
              <p className="text-[10px] text-white/80">
                <strong>Tip:</strong> After adding a node, connect it by dragging from the connection points.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

