import nodemailer from 'nodemailer';

/**
 * Creates a professional HTML email template
 * @param subject - Email subject
 * @param content - Main content body
 * @returns HTML email template
 */
function createEmailTemplate(subject: string, content: string): string {
  const htmlContent = content.replace(/\n/g, '<br>');
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #8b5cf6;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header h1 {
      margin: 0;
      color: #1f2937;
      font-size: 24px;
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content {
      color: #4b5563;
      font-size: 15px;
      line-height: 1.8;
      margin-bottom: 24px;
    }
    .content p {
      margin: 12px 0;
    }
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      margin-top: 32px;
      text-align: center;
      color: #9ca3af;
      font-size: 13px;
    }
    .footer-icon {
      color: #8b5cf6;
      font-size: 20px;
      margin-bottom: 8px;
    }
    .timestamp {
      background-color: #f3f4f6;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      color: #6b7280;
      margin-top: 16px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>${subject}</h1>
      <span class="badge">🤖 AI Generated</span>
    </div>
    
    <div class="content">
      ${htmlContent}
    </div>
    
    <div class="timestamp">
      ⏰ Generated on ${new Date().toLocaleString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}
    </div>
    
    <div class="footer">
      <div class="footer-icon">✨</div>
      <p>Powered by <strong>AI Workflow Orchestrator</strong></p>
      <p>Cerebras AI × Groq Whisper × React Flow</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Sends an email via SMTP with professional template
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param body - Email body content
 * @returns Success message
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<string> {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
      throw new Error('SMTP credentials not configured. Please add Gmail SMTP settings to .env.local');
    }

    console.log('Sending email via Gmail SMTP...');
    console.log('From:', smtpUser);
    console.log('To:', to);
    console.log('Subject:', subject);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: false, // Use TLS (STARTTLS)
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    });

    // Verify connection
    await transporter.verify();
    console.log('✓ SMTP connection verified');

    // Create beautiful HTML email
    const htmlEmail = createEmailTemplate(subject, body);

    // Send email
    const info = await transporter.sendMail({
      from: `"AI Workflow Orchestrator" <${smtpUser}>`,
      to: to,
      subject: subject,
      text: body, // Plain text fallback
      html: htmlEmail, // Beautiful HTML version
    });

    console.log('✓ Email sent successfully:', info.messageId);
    console.log('✓ Preview URL:', nodemailer.getTestMessageUrl(info));
    
    return `Email sent successfully to ${to} (Message ID: ${info.messageId})`;
  } catch (error: any) {
    console.error('Email send error:', error);
    
    // Provide helpful error messages
    if (error.code === 'EAUTH') {
      throw new Error('Gmail authentication failed. Check your app password is correct (remove spaces!)');
    } else if (error.code === 'ESOCKET') {
      throw new Error('Cannot connect to Gmail SMTP server. Check your internet connection.');
    } else if (error.message.includes('Invalid login')) {
      throw new Error('Invalid Gmail credentials. Make sure you are using an App Password, not your regular password.');
    }
    
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

