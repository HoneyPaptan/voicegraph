import nodemailer from 'nodemailer';

/**
 * Converts markdown-like text to HTML
 * @param content - Text content with markdown-like formatting
 * @returns HTML formatted content
 */
function markdownToHtml(content: string): string {
  return content
    // Headers
    .replace(/^### (.*$)/gim, '<h3 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 20px 0 12px 0; border-left: 3px solid #ffffff; padding-left: 12px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 24px 0 16px 0; border-bottom: 2px solid #ffffff; padding-bottom: 8px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 28px 0 20px 0;">$1</h1>')
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ffffff; font-weight: 600;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color: #ffffff; font-style: italic;">$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 6px; padding: 16px; margin: 16px 0; overflow-x: auto; color: #ffffff; font-family: \'Monaco\', \'Menlo\', \'Ubuntu Mono\', monospace; font-size: 14px; line-height: 1.5;"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background-color: #1a1a1a; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-family: \'Monaco\', \'Menlo\', \'Ubuntu Mono\', monospace; font-size: 13px;">$1</code>')
    // Lists
    .replace(/^\* (.*$)/gim, '<li style="color: #ffffff; margin: 8px 0; padding-left: 8px;">$1</li>')
    .replace(/^- (.*$)/gim, '<li style="color: #ffffff; margin: 8px 0; padding-left: 8px;">$1</li>')
    .replace(/(<li.*<\/li>)/gs, '<ul style="margin: 16px 0; padding-left: 20px;">$1</ul>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #ffffff; text-decoration: underline; text-decoration-color: #666;">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Tables (basic support)
    .replace(/\|(.+)\|/g, '<tr><td style="border: 1px solid #333; padding: 8px; color: #ffffff;">$1</td></tr>')
    .replace(/(<tr>.*<\/tr>)/gs, '<table style="border-collapse: collapse; margin: 16px 0; width: 100%;">$1</table>');
}

/**
 * Creates a beautiful Vercel-themed HTML email template with Voice Graph branding
 * @param subject - Email subject
 * @param content - Main content body (supports markdown-like formatting)
 * @returns HTML email template
 */
function createEmailTemplate(subject: string, content: string): string {
  const htmlContent = markdownToHtml(content);
  
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
      color: #ffffff;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
      min-height: 100vh;
    }
    .email-container {
      background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
      border: 1px solid #333333;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      position: relative;
      overflow: hidden;
    }
    .email-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, #ffffff, transparent);
    }
    .header {
      border-bottom: 1px solid #333333;
      padding-bottom: 24px;
      margin-bottom: 32px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }
    .logo-subtitle {
      font-size: 12px;
      color: #888888;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
      color: #000000;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      border: 1px solid #333333;
    }
    .content {
      color: #ffffff;
      font-size: 15px;
      line-height: 1.8;
      margin-bottom: 32px;
    }
    .content p {
      margin: 16px 0;
      color: #ffffff;
    }
    .content h1, .content h2, .content h3 {
      color: #ffffff;
    }
    .content ul, .content ol {
      margin: 16px 0;
      padding-left: 20px;
    }
    .content li {
      margin: 8px 0;
      color: #ffffff;
    }
    .content code {
      background-color: #1a1a1a;
      color: #ffffff;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
    }
    .content pre {
      background-color: #1a1a1a;
      border: 1px solid #333;
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
      overflow-x: auto;
      color: #ffffff;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
      line-height: 1.5;
    }
    .content table {
      border-collapse: collapse;
      margin: 16px 0;
      width: 100%;
    }
    .content td {
      border: 1px solid #333;
      padding: 8px;
      color: #ffffff;
    }
    .footer {
      border-top: 1px solid #333333;
      padding-top: 24px;
      margin-top: 32px;
      text-align: center;
      color: #888888;
      font-size: 13px;
    }
    .footer-brand {
      color: #ffffff;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .footer-tech {
      color: #666666;
      font-size: 12px;
      margin-bottom: 16px;
    }
    .timestamp {
      background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
      border: 1px solid #333333;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 12px;
      color: #888888;
      margin-top: 20px;
      display: inline-block;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #333333, transparent);
      margin: 24px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">Voice Graph</div>
      <div class="logo-subtitle">AI Workflow Orchestrator</div>
      <h1>${subject}</h1>
      <span class="badge">🤖 AI Generated</span>
    </div>
    
    <div class="content">
      ${htmlContent}
    </div>
    
    <div class="divider"></div>
    
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
      <div class="footer-brand">Voice Graph</div>
      <div class="footer-tech">Powered by Cerebras AI × Groq Whisper × React Flow</div>
      <p>Build voice-to-workflow automation with visual graph interface</p>
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
      from: `"Voice Graph" <${smtpUser}>`,
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

