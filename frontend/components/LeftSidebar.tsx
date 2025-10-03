'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { Card } from './ui/card';
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
  const [activeTab, setActiveTab] = useState<'templates'>('templates');

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="default"
          size="icon"
          aria-label="Tools Menu"
          className="fixed top-6 left-6 bg-white hover:bg-white/90 text-black shadow-2xl z-50 font-semibold border border-white/20 pointer-events-auto"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-96 bg-black/90 border-white/15 backdrop-blur-lg px-4">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left text-white">Workflow Tools</SheetTitle>
        </SheetHeader>
        
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-black/60 p-1 rounded-lg border border-white/10">
          <Button
            variant={activeTab === 'templates' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('templates')}
            className={`flex-1 gap-1 ${activeTab === 'templates' ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
          >
            <BookOpen className="w-3 h-3" />
            Templates
          </Button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {activeTab === 'templates' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold mb-3 text-white">Advanced Templates</h3>
              
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-3 bg-black/40 hover:bg-black/60 border-white/20 text-white transition-all"
                onClick={() => {
                  onLoadExample('Get recent commits from my GitHub repository, analyze the code changes, and create a Notion page with development summary');
                  setIsOpen(false);
                }}
              >
                <div>
                  <div className="font-medium text-xs">Dev Progress Tracker</div>
                  <div className="text-[10px] text-white/60">GitHub → Analyze → Notion</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-3 bg-black/40 hover:bg-black/60 border-white/20 text-white transition-all"
                onClick={() => {
                  onLoadExample('Search for latest AI news, analyze trends and innovations, then email me market insights report');
                  setIsOpen(false);
                }}
              >
                <div>
                  <div className="font-medium text-xs">Market Intelligence</div>
                  <div className="text-[10px] text-white/60">Web Search → Analysis → Email</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-3 bg-black/40 hover:bg-black/60 border-white/20 text-white transition-all"
                onClick={() => {
                  onLoadExample('Get my Notion project tasks, search for best practices, analyze both together, and email me an action plan with recommendations');
                  setIsOpen(false);
                }}
              >
                <div>
                  <div className="font-medium text-xs">Smart Action Planner</div>
                  <div className="text-[10px] text-white/60">Multi-source → AI Planning → Email</div>
                </div>
              </Button>
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
