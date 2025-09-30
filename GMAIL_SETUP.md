# 📧 Gmail SMTP Setup Guide

## Quick Setup (5 Minutes)

### Step 1: Enable 2-Factor Authentication (2FA)

1. Go to: https://myaccount.google.com/security
2. Scroll to **"Signing in to Google"**
3. Click **"2-Step Verification"**
4. Click **"Get Started"** and follow the prompts
5. Verify with your phone number

⚠️ **You MUST have 2FA enabled to generate app passwords!**

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
   - Or go to https://myaccount.google.com → Security → 2-Step Verification → App passwords

2. You might need to sign in again

3. Under "Select app", choose: **Mail**

4. Under "Select device", choose: **Other (Custom name)**

5. Type a name: `Workflow Orchestrator`

6. Click **Generate**

7. You'll see a **16-character password** like this:
   ```
   abcd efgh ijkl mnop
   ```

8. **Copy this password** and remove all spaces:
   ```
   abcdefghijklmnop
   ```

9. Click **Done**

### Step 3: Add to Your Project

Edit `frontend/.env.local` and add:

```env
# Existing keys
CEREBRAS_API_KEY=KEY
GROQ_API_KEY=KEY

# Gmail SMTP - ADD THESE
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
```

**Replace:**
- `yourname@gmail.com` → Your actual Gmail address
- `abcdefghijklmnop` → Your app password (NO SPACES!)

### Step 4: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
cd frontend
npm run dev
```

## ✅ Test Your Setup

Run a workflow with email step and you should receive a beautiful HTML email!

## 🎨 Email Template Features

Your workflow emails will include:

✨ **Professional Design:**
- Clean, modern HTML layout
- Gradient header with AI badge
- Readable typography
- Mobile-responsive

📋 **Automatic Details:**
- Subject line
- Generated content
- Timestamp
- "Powered by" footer

## 🐛 Troubleshooting

### Error: "SMTP credentials not configured"

✅ **Solution:** Make sure all 4 SMTP variables are set in `.env.local`

### Error: "Invalid login"

✅ **Solutions:**
1. Make sure you're using the **app password**, not your regular Gmail password
2. Remove all spaces from the app password
3. Make sure 2FA is enabled on your Google account

### Error: "Gmail authentication failed"

✅ **Solutions:**
1. Go back to https://myaccount.google.com/apppasswords
2. Delete the old app password
3. Generate a new one
4. Update `.env.local` with the new password
5. Restart the dev server

### Error: "Cannot connect to Gmail SMTP server"

✅ **Solutions:**
1. Check your internet connection
2. Make sure port 587 isn't blocked by your firewall
3. Try changing `SMTP_PORT` to `465` (and restart server)

### Not receiving emails?

✅ **Check:**
1. **Spam folder** - Gmail might filter AI-generated emails
2. **Sent folder** - Check if it shows in your Gmail sent folder
3. **Console logs** - Look for "Message ID" in the terminal
4. **Email address** - Make sure recipient email is correct

## 📝 Example .env.local File

```env
# AI Services
CEREBRAS_API_KEY=KEY
GROQ_API_KEY=KEY

# Notion (Optional - only if using Notion integration)
NOTION_API_KEY=secret_your_notion_key_here

# Gmail SMTP (Required for email workflows)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=john.doe@gmail.com
SMTP_PASSWORD=abcdefghijklmnop

# Optional
NODE_ENV=development
```

## 🔒 Security Notes

- **Never commit `.env.local`** - It's already in `.gitignore`
- **App passwords are safer** than your main password
- **Revoke app passwords** you're not using
- **Each project should have its own** app password

## 🎯 For Demo/Production

If you're deploying:

1. **Vercel/Railway:** Add env vars in their dashboard
2. **Docker:** Pass as environment variables in `docker-compose.yml`
3. **GitHub:** Never commit actual passwords to git!

## 📧 Alternative: SendGrid (Production)

For production apps, consider using SendGrid instead:

```env
# Instead of SMTP
SENDGRID_API_KEY=your_sendgrid_api_key
```

But for hackathon demos, Gmail works great! 🚀

---

**Questions?** The app will show helpful error messages if something goes wrong!

