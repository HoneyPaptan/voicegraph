'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface VoiceInputProps {
  onTranscribed: (text: string) => void;
  isEditMode?: boolean;
}

/**
 * VoiceInput component - Records audio and transcribes using Groq Whisper
 */
export function VoiceInput({ onTranscribed, isEditMode = false }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
    <div className="flex flex-col items-center gap-4">
      {isEditMode && (
        <div className="text-center mb-2">
          <span className="inline-block px-3 py-1 bg-purple-500/20 border border-purple-500 rounded-full text-purple-300 text-sm font-medium">
            🎤 Edit Mode Active
          </span>
          <p className="text-xs text-gray-400 mt-2">
            Speak to add, remove, or modify workflow nodes
          </p>
        </div>
      )}
      
      <div className="flex items-center gap-3">
        {!isRecording && !isProcessing && (
          <Button
            onClick={startRecording}
            size="lg"
            className={`gap-2 ${isEditMode ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
          >
            <Mic className="w-5 h-5" />
            {isEditMode ? 'Record Edit Command' : 'Start Recording'}
          </Button>
        )}

        {isRecording && (
          <Button
            onClick={stopRecording}
            size="lg"
            variant="destructive"
            className="gap-2 animate-pulse"
          >
            <Square className="w-5 h-5" />
            Stop Recording
          </Button>
        )}

        {isProcessing && (
          <Button
            size="lg"
            disabled
            className="gap-2"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            Transcribing...
          </Button>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center max-w-md">
          {error}
        </div>
      )}
    </div>
  );
}

