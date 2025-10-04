import { NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';

/**
 * GET /api/test-inngest
 * Test if Inngest is working properly
 */
export async function GET() {
  try {
    console.log('🧪 Testing Inngest connection...');
    
    // Test sending a simple event
    const testEvent = await inngest.send({
      name: 'test/connection',
      data: {
        message: 'Test connection from VoiceGraph',
        timestamp: new Date().toISOString(),
      },
    });
    
    console.log('✅ Inngest test event sent:', testEvent);
    
    return NextResponse.json({
      success: true,
      message: 'Inngest connection test successful',
      eventId: testEvent.ids?.[0],
    });
    
  } catch (error: any) {
    console.error('❌ Inngest test failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
