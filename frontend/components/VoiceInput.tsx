'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface VoiceInputProps {
  onTranscribed: (text: string) => void;
  isEditMode?: boolean;
  autoStart?: boolean;
}

/**
 * VoiceInput component - Records audio and transcribes using Groq Whisper
 */
export function VoiceInput({ onTranscribed, isEditMode = false, autoStart = false }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<number | null>(null);
  const MAX_DURATION_MS = 30_000; // Auto-stop after 30s to avoid overly long clips

  // Auto-start recording when requested (e.g., from Voice Edit quick action)
  useEffect(() => {
    if (autoStart && !isRecording && !isProcessing) {
      startRecording();
    }
    // We intentionally exclude startRecording to avoid re-creating effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const startRecording = async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
      // Auto-stop after MAX_DURATION_MS
      stopTimerRef.current = window.setTimeout(() => {
        if (mediaRecorderRef.current && isRecording) {
          try { mediaRecorderRef.current.stop(); } catch {}
          setIsRecording(false);
        }
      }, MAX_DURATION_MS);
      
      console.log('Recording started');
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      console.log('Recording stopped');
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true);
      setError(null);

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      console.log('Sending audio for transcription...');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        // A tiny domain hint header the server could use in future to adjust settings
        headers: { 'x-domain-hint': 'workflow_orchestrator' },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transcription failed');
      }

      console.log('Transcription successful:', data.text);
      onTranscribed(data.text);
      
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Failed to transcribe audio');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {isEditMode && (
        <div className="text-center w-full">
          <span className="inline-block px-2 py-1 bg-white/10 border border-white/20 rounded-full text-white/80 text-xs font-medium">
            🎤 Edit Mode
          </span>
          <p className="text-[10px] text-white/70 mt-1">
            Speak to add, remove, or modify nodes
          </p>
        </div>
      )}
      
      <div className="flex items-center gap-2 w-full justify-center">
        {!isRecording && !isProcessing && (
          <Button
            onClick={startRecording}
            size="sm"
            className={`gap-2 w-full bg-white hover:bg-white/90 text-black`}
          >
            <Mic className="w-4 h-4" />
            {isEditMode ? 'Record Edit' : 'Start Recording'}
          </Button>
        )}

        {isRecording && (
          <Button
            onClick={stopRecording}
            size="sm"
            className="gap-2 w-full bg-white text-black hover:bg-white/90"
          >
            <Square className="w-4 h-4" />
            Stop Recording
          </Button>
        )}

        {isProcessing && (
          <Button
            size="sm"
            disabled
            className="gap-2 w-full bg-white/10 text-white"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Transcribing...
          </Button>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-xs text-center w-full">
          {error}
        </div>
      )}
    </div>
  );
}

