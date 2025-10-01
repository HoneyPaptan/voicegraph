'use client';

import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Database, Sparkles, Mail, Search, Github, FileEdit, X, Plus } from 'lucide-react';

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
    color: 'from-blue-500 to-blue-600',
    actions: ['fetch_page', 'fetch_database', 'query_database'],
  },
  {
    type: 'notion_create',
    label: 'Notion Create',
    icon: <FileEdit className="w-5 h-5" />,
    description: 'Create new Notion pages',
    color: 'from-blue-600 to-indigo-600',
    actions: ['create_page'],
  },
  {
    type: 'llm',
    label: 'AI Processing',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'Process with Cerebras AI',
    color: 'from-blue-500 to-blue-600',
    actions: ['summarize', 'analyze', 'extract_insights', 'transform', 'generate'],
  },
  {
    type: 'email',
    label: 'Email',
    icon: <Mail className="w-5 h-5" />,
    description: 'Send emails via SMTP',
    color: 'from-green-500 to-green-600',
    actions: ['send'],
  },
  {
    type: 'tavily',
    label: 'Web Search',
    icon: <Search className="w-5 h-5" />,
    description: 'Search the web with Tavily',
    color: 'from-orange-500 to-orange-600',
    actions: ['search', 'search_news'],
  },
  {
    type: 'github',
    label: 'GitHub',
    icon: <Github className="w-5 h-5" />,
    description: 'Get GitHub repository info',
    color: 'from-gray-700 to-gray-800',
    actions: ['get_commits', 'get_repo_info', 'get_pull_requests'],
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
                className="justify-start h-8 text-xs bg-gray-900/50 border-gray-700 hover:bg-gray-800/70"
                onClick={() => setSelectedNode(node)}
              >
                <span className={`inline-flex items-center gap-2`}>
                  <span className={`p-1 rounded bg-gradient-to-br ${node.color}`}>{node.icon}</span>
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
              className="text-xs justify-start h-8 px-2 text-gray-300 hover:text-white hover:bg-gray-800/60"
            >
              <span className="mr-1">←</span>
              Back to nodes
            </Button>
            {selectedNode.actions.map((action) => (
              <Button
                key={action}
                variant="outline"
                className="justify-between h-8 text-xs bg-gray-900/50 border-gray-700 hover:bg-gray-800/70"
                onClick={() => handleAddNode(selectedNode.type, action)}
              >
                <span className="capitalize">{action.replace(/_/g, ' ')}</span>
                <Plus className="w-3 h-3 text-blue-400" />
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
        <h3 className="font-semibold text-sm">Nodes Library</h3>
        <p className="text-xs text-gray-400">Click to add nodes</p>
      </div>

      <div className="space-y-3">
        {!selectedNode ? (
          <div className="space-y-3">
            {AVAILABLE_NODES.map((node) => (
              <Card
                key={node.type}
                className="p-3 bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer"
                onClick={() => setSelectedNode(node)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${node.color}`}>
                    {node.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{node.label}</h4>
                    <p className="text-xs text-gray-400 mt-1">{node.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-blue-400">
                        {node.actions.length} actions
                      </span>
                      <span className="text-[10px] text-gray-500">→ Click to view</span>
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
              className="mb-3 text-xs"
            >
              ← Back to all nodes
            </Button>

            <div className="mb-3 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${selectedNode.color}`}>
                  {selectedNode.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{selectedNode.label}</h4>
                  <p className="text-xs text-gray-400">{selectedNode.description}</p>
                </div>
              </div>
            </div>

            <h4 className="text-xs font-semibold mb-2 text-gray-300">Available Actions</h4>
            <div className="space-y-2">
              {selectedNode.actions.map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  className="w-full justify-between text-left h-auto py-2 px-3 bg-gray-800/30 hover:bg-blue-600/20 border-gray-700 hover:border-blue-600"
                  onClick={() => handleAddNode(selectedNode.type, action)}
                >
                  <div>
                    <div className="font-medium text-xs capitalize">
                      {action.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Click to add to canvas
                    </div>
                  </div>
                  <Plus className="w-3 h-3 text-blue-400" />
                </Button>
              ))}
            </div>

            <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-[10px] text-blue-300">
                <strong>💡 Tip:</strong> After adding a node, connect it to other nodes by dragging from the connection points.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

