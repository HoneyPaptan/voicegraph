'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { NodesLibrary } from './NodesLibrary';
import { Menu, Sparkles, BookOpen } from 'lucide-react';

interface LeftSidebarProps {
  // Voice Input props
  onTranscribed: (text: string) => void;
  
  // Templates props
  onLoadExample: (text: string) => void;
  
  // Nodes Library props
  onAddNode: (type: string, action: string) => void;
  
  // Manual mode props
  manualMode: boolean;
  onToggleManualMode: () => void;
  
  // General props
  hasWorkflow: boolean;
}

export function LeftSidebar({
  onTranscribed,
  onLoadExample,
  onAddNode,
  manualMode,
  onToggleManualMode,
  hasWorkflow
}: LeftSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'nodes'>('templates');

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="default"
          size="icon"
          aria-label="Tools Menu"
          className="fixed top-6 left-6 bg-blue-600 hover:bg-blue-700 shadow-2xl z-50 font-semibold border-2 border-blue-500 pointer-events-auto"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-96 bg-gray-900/95 border-gray-700 backdrop-blur-lg px-4">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">Workflow Tools</SheetTitle>
        </SheetHeader>
        
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-gray-800/50 p-1 rounded-lg">
          <Button
            variant={activeTab === 'templates' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('templates')}
            className="flex-1 gap-1"
          >
            <BookOpen className="w-3 h-3" />
            Templates
          </Button>
          <Button
            variant={activeTab === 'nodes' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('nodes')}
            className="flex-1 gap-1"
          >
            <Sparkles className="w-3 h-3" />
            Nodes
          </Button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {activeTab === 'templates' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold mb-3">Advanced Templates</h3>
              
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-3 bg-gray-800/50 hover:bg-green-800/30 border-gray-600 hover:border-green-600 transition-all group"
                onClick={() => {
                  onLoadExample('Get recent commits from my GitHub repository, analyze the code changes, and create a Notion page with development summary');
                  setIsOpen(false);
                }}
              >
                <div>
                  <div className="font-medium text-xs text-green-300 group-hover:text-green-200">Dev Progress Tracker</div>
                  <div className="text-[10px] text-gray-400">GitHub → Analyze → Notion</div>
                  <div className="text-[9px] text-green-600 mt-0.5">🚀 Development workflow</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-3 bg-gray-800/50 hover:bg-blue-800/30 border-gray-600 hover:border-blue-600 transition-all group"
                onClick={() => {
                  onLoadExample('Search for latest AI news, analyze trends and innovations, then email me market insights report');
                  setIsOpen(false);
                }}
              >
                <div>
                  <div className="font-medium text-xs text-blue-300 group-hover:text-blue-200">Market Intelligence</div>
                  <div className="text-[10px] text-gray-400">Web Search → Analysis → Email</div>
                  <div className="text-[9px] text-blue-600 mt-0.5">📊 Research workflow</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-3 bg-gray-800/50 hover:bg-orange-800/30 border-gray-600 hover:border-orange-600 transition-all group"
                onClick={() => {
                  onLoadExample('Get my Notion project tasks, search for best practices, analyze both together, and email me an action plan with recommendations');
                  setIsOpen(false);
                }}
              >
                <div>
                  <div className="font-medium text-xs text-orange-300 group-hover:text-orange-200">Smart Action Planner</div>
                  <div className="text-[10px] text-gray-400">Multi-source → AI Planning → Email</div>
                  <div className="text-[9px] text-orange-600 mt-0.5">⚡ Productivity workflow</div>
                </div>
              </Button>
            </div>
          )}

          {activeTab === 'nodes' && (
            <div className="space-y-4">
              <NodesLibrary onAddNode={onAddNode} />
            </div>
          )}
        </div>

        {/* Manual Mode Toggle */}
        {hasWorkflow && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <Button
              onClick={onToggleManualMode}
              variant={manualMode ? 'default' : 'outline'}
              className="w-full gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {manualMode ? 'Manual Mode: ON' : 'Enable Manual Mode'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
