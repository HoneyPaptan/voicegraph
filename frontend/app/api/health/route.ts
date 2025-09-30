import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Health check endpoint for Docker monitoring
 */
export async function GET() {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        cerebras: !!process.env.CEREBRAS_API_KEY,
        groq: !!process.env.GROQ_API_KEY,
        notion: !!process.env.NOTION_API_KEY,
        smtp: !!(
          process.env.SMTP_HOST &&
          process.env.SMTP_PORT &&
          process.env.SMTP_USER &&
          process.env.SMTP_PASSWORD
        ),
      },
    };

    return NextResponse.json(health);
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

