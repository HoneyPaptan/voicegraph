import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

/**
 * POST /api/transcribe
 * Transcribes audio using Groq Whisper
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('Transcribing audio file:', audioFile.name, audioFile.type, audioFile.size);

    // Initialize Groq client
    const groq = new Groq({ apiKey });

    // Transcribe audio
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      response_format: 'json',
      language: 'en',
    });

    console.log('Transcription result:', transcription.text);

    return NextResponse.json({ 
      text: transcription.text,
      success: true 
    });

  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Transcription failed',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

