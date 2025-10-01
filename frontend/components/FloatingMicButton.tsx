'use client';

import { useState, useRef } from 'react';
import { Mic, Square, Loader2, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingMicButtonProps {
  onTranscribed: (text: string) => void;
}

export function FloatingMicButton({ onTranscribed }: FloatingMicButtonProps) {
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
    <div className="flex flex-col items-center gap-6">
      {/* Main Mic Button */}
      <AnimatePresence mode="wait">
        {!isRecording && !isProcessing && (
          <motion.button
            key="mic-button"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startRecording}
            className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 shadow-2xl flex items-center justify-center transition-all duration-300 group"
          >
            <Mic className="w-10 h-10 text-white" />
            
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full bg-purple-600 opacity-20 animate-ping"></div>
            <div className="absolute inset-0 rounded-full bg-purple-600 opacity-10 animate-pulse"></div>
          </motion.button>
        )}

        {isRecording && (
          <motion.button
            key="recording-button"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopRecording}
            className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 shadow-2xl flex items-center justify-center transition-all duration-300"
          >
            <Square className="w-10 h-10 text-white fill-current" />
            
            {/* Recording indicator pulse */}
            <div className="absolute inset-0 rounded-full bg-red-600 opacity-30 animate-pulse"></div>
            <div className="absolute -top-2 -right-2">
              <div className="flex items-center gap-1 bg-red-600 px-2 py-1 rounded-full">
                <Radio className="w-3 h-3 text-white animate-pulse" />
                <span className="text-xs text-white font-medium">REC</span>
              </div>
            </div>
          </motion.button>
        )}

        {isProcessing && (
          <motion.div
            key="processing-button"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 shadow-2xl flex items-center justify-center"
          >
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Text */}
      <AnimatePresence mode="wait">
        {!isRecording && !isProcessing && (
          <motion.div
            key="status-idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <p className="text-white text-xl font-semibold mb-2">
              Click to start recording
            </p>
            <p className="text-gray-400 text-sm">
              Speak your workflow automation naturally
            </p>
          </motion.div>
        )}

        {isRecording && (
          <motion.div
            key="status-recording"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <p className="text-white text-xl font-semibold mb-2 animate-pulse">
              Listening...
            </p>
            <p className="text-gray-400 text-sm">
              Click to stop recording
            </p>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div
            key="status-processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <p className="text-white text-xl font-semibold mb-2">
              Processing...
            </p>
            <p className="text-gray-400 text-sm">
              Transcribing with AI
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/50 border border-red-700 px-4 py-2 rounded-lg backdrop-blur-md"
        >
          <p className="text-red-300 text-sm text-center">{error}</p>
        </motion.div>
      )}
    </div>
  );
}

