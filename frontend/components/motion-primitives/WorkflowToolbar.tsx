'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import useMeasure from 'react-use-measure';
import { Button } from '@/components/ui/button';
import { Play, Loader2, Mic, Zap, Type, Square } from 'lucide-react';
import { VoiceInput } from '@/components/VoiceInput';

const transition = {
  type: 'spring' as const,
  bounce: 0.1,
  duration: 0.25,
};

interface WorkflowToolbarProps {
  onRun: () => void;
  onVoiceEdit: (text: string) => void;
  isExecuting: boolean;
  onOpenText: () => void;
  textCommand: string;
  onTextChange: (text: string) => void;
  isParsingWorkflow: boolean;
  isEditingWorkflow: boolean;
}

export default function WorkflowToolbar({
  onRun,
  onVoiceEdit,
  isExecuting,
  onOpenText,
  textCommand,
  onTextChange,
  isParsingWorkflow,
  isEditingWorkflow,
}: WorkflowToolbarProps) {
  const [refContent, { height }] = useMeasure();
  const [refMenu, { width }] = useMeasure();
  const [isOpen, setIsOpen] = React.useState(false);
  const [maxWidth, setMaxWidth] = React.useState(0);
  const [active, setActive] = React.useState<number | null>(null);
  
  // Voice recording state
  const [isRecording, setIsRecording] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    if (!width || maxWidth > 0) return;
    setMaxWidth(width);
  }, [width, maxWidth]);

  // Handle recording state changes
  React.useEffect(() => {
    if (isRecording && active === 2) {
      // Recording started
      console.log('Voice recording started');
    } else if (!isRecording && active === 2) {
      // Recording stopped
      console.log('Voice recording stopped');
    }
  }, [isRecording, active]);

  const handleVoiceTranscribed = async (text: string) => {
    try {
      onVoiceEdit(text);
      setIsOpen(false);
      setActive(null);
    } catch (e) {
      console.error('Voice edit failed:', e);
    } finally {
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  // Reset recording state when dropdown closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsRecording(false);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const ITEMS = [
    {
      id: 1,
      title: (
        <Button size="icon" className="h-9 w-9 bg-black text-white hover:bg-black/80" aria-label="Run" disabled={isExecuting}>
          {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
        </Button>
      ),
      content: null,
      onClick: onRun,
    },
    {
      id: 2,
      title: (
        <Button size="icon" className="h-9 w-9 bg-black text-white hover:bg-black/80" aria-label="Voice Edit">
          <Mic className="w-4 h-4" />
        </Button>
      ),
      content: (
        <div className="p-3 w-[320px]">
          <div className="text-xs text-white/70 mb-3">
            {isRecording ? 'Recording... Speak your edit command.' : 
             'Click to start recording your edit. If no workflow exists, this will create a new one.'}
          </div>
          <div className="flex flex-col items-center gap-3 w-full">
            {!isRecording && !isProcessing && (
              <Button
                onClick={() => {
                  setIsRecording(true);
                }}
                size="sm"
                className="gap-2 w-full bg-black hover:bg-black/80 text-white"
              >
                <Mic className="w-4 h-4" />
                Start Recording
              </Button>
            )}
            
            {isRecording && (
              <Button
                onClick={() => {
                  setIsRecording(false);
                }}
                size="sm"
                className="gap-2 w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </Button>
            )}
            
            {isProcessing && (
              <div className="flex items-center gap-2 w-full justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span className="text-white text-sm">Processing...</span>
              </div>
            )}
            
            {isRecording && (
              <VoiceInput 
                onTranscribed={async (text) => {
                  setIsProcessing(true);
                  try {
                    await handleVoiceTranscribed(text);
                  } finally {
                    setIsProcessing(false);
                    setIsOpen(false);
                    setActive(null);
                  }
                }} 
                isEditMode 
                autoStart={isRecording}
              />
            )}
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: (
        <Button size="icon" className="h-9 w-9 bg-black text-white hover:bg-black/80" aria-label="Text">
          <Type className="w-4 h-4" />
        </Button>
      ),
      content: (
        <div className="p-3 w-[320px]">
          <div className="text-xs text-white/70 mb-3">Type your command</div>
          <div className="relative">
            <input
              className="h-9 w-full rounded-lg border border-white/15 bg-black p-2 pr-16 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              autoFocus
              placeholder="Describe your automation..."
              value={textCommand}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isParsingWorkflow && !isEditingWorkflow) {
                  onOpenText();
                  setIsOpen(false);
                  setActive(null);
                }
              }}
              disabled={isParsingWorkflow || isEditingWorkflow}
            />
            <div className="absolute right-1 top-0 flex h-full items-center justify-center">
              <Button
                size="sm"
                className="bg-black text-white hover:bg-black/80 h-7 px-2"
                onClick={() => {
                  if (!isParsingWorkflow && !isEditingWorkflow) {
                    onOpenText();
                    setIsOpen(false);
                    setActive(null);
                  }
                }}
                disabled={isParsingWorkflow || isEditingWorkflow}
              >
                {isParsingWorkflow || isEditingWorkflow ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      ),
    },

  ];

  return (
    <MotionConfig transition={transition}>
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto">
        <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-lg">
          <div className="overflow-hidden">
            <AnimatePresence initial={false} mode="sync">
              {isOpen ? (
                <motion.div
                  key="content"
                  initial={{ height: 0 }}
                  animate={{ height: height || 0 }}
                  exit={{ height: 0 }}
                  style={{ 
                    width: active === 2 || active === 3 ? '320px' : maxWidth,
                    minWidth: '200px'
                  }}
                >
                  <div ref={refContent}>
                    {ITEMS.map((item) => {
                      if (item.content && active === item.id) {
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            {item.content}
                          </motion.div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <div className="flex space-x-2 p-2" ref={refMenu}>
            {ITEMS.map((it) => (
              <div key={it.id} onClick={() => { 
                if (it.content) { 
                  if (active === it.id) {
                    // If already open, close it
                    setIsOpen(false);
                    setActive(null);
                  } else {
                    // If closed, open it
                    setIsOpen(true);
                    setActive(it.id);
                  }
                } else {
                  // For buttons without content (like Run, BG), just call their onClick
                  it.onClick?.();
                }
              }}>
                {it.title}
              </div>
            ))}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}


