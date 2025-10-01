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
    color: 'from-purple-500 to-purple-600',
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

export function NodesLibrary({ onAddNode }: NodesLibraryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeLibraryItem | null>(null);

  const handleAddNode = (type: string, action: string) => {
    onAddNode(type, action);
    // Show success feedback
    console.log(`✅ Added ${type} node with action: ${action}`);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed top-6 right-6 gap-2 bg-purple-600 hover:bg-purple-700 z-30 shadow-2xl"
        size="default"
      >
        <Plus className="w-4 h-4" />
        Nodes Library
      </Button>
    );
  }

  return (
    <Card className="fixed top-6 right-6 w-96 max-h-[calc(100vh-80px)] bg-gray-900/95 border-2 border-purple-600/50 backdrop-blur-lg shadow-2xl overflow-hidden flex flex-col z-30">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-purple-600/10">
        <div>
          <h3 className="font-semibold text-lg">Nodes Library</h3>
          <p className="text-xs text-gray-400">Drag & drop to add nodes</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setSelectedNode(null);
          }}
          className="hover:bg-gray-800"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!selectedNode ? (
          // Node Types List
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
                      <span className="text-[10px] text-purple-400">
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
          // Selected Node Actions
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedNode(null)}
              className="mb-4 text-xs"
            >
              ← Back to all nodes
            </Button>

            <div className="mb-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${selectedNode.color}`}>
                  {selectedNode.icon}
                </div>
                <div>
                  <h4 className="font-semibold">{selectedNode.label}</h4>
                  <p className="text-xs text-gray-400">{selectedNode.description}</p>
                </div>
              </div>
            </div>

            <h4 className="text-sm font-semibold mb-3 text-gray-300">Available Actions</h4>
            <div className="space-y-2">
              {selectedNode.actions.map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  className="w-full justify-between text-left h-auto py-3 px-4 bg-gray-800/30 hover:bg-purple-600/20 border-gray-700 hover:border-purple-600"
                  onClick={() => handleAddNode(selectedNode.type, action)}
                >
                  <div>
                    <div className="font-medium text-sm capitalize">
                      {action.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Click to add to canvas
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-purple-400" />
                </Button>
              ))}
            </div>

            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-300">
                <strong>💡 Tip:</strong> After adding a node, connect it to other nodes by dragging from the connection points on the nodes.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

