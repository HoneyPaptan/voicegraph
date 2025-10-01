import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * GET /api/test-smtp
 * Tests SMTP connection without sending email
 */
export async function GET() {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      return NextResponse.json(
        { 
          success: false,
          error: 'SMTP credentials not configured',
          configured: {
            host: !!smtpHost,
            port: !!smtpPort,
            user: !!smtpUser,
            password: !!smtpPassword,
          }
        },
        { status: 500 }
      );
    }

    console.log('Testing SMTP connection...');
    console.log('Host:', smtpHost);
    console.log('Port:', smtpPort);
    console.log('User:', smtpUser);
    console.log('Password length:', smtpPassword.length);
    console.log('Password first 4 chars:', smtpPassword.substring(0, 4) + '...');

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection
    await transporter.verify();

    return NextResponse.json({
      success: true,
      message: '✅ SMTP connection successful!',
      details: {
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        passwordLength: smtpPassword.length,
      }
    });

  } catch (error: any) {
    console.error('SMTP test error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: {
          response: error.response,
          responseCode: error.responseCode,
          command: error.command,
        },
        help: (error.code && {
          EAUTH: 'Invalid credentials. Regenerate your Gmail app password.',
          ESOCKET: 'Cannot connect to Gmail. Check internet connection.',
          ETIMEDOUT: 'Connection timeout. Check firewall/port 587.',
        }[error.code as string]) || 'Unknown error. Check credentials and try again.'
      },
      { status: 500 }
    );
  }
}

