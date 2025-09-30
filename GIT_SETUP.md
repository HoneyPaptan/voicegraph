# 🔐 Git Setup & Security Guide

## ✅ .gitignore Files Created

Two `.gitignore` files have been added to protect your sensitive data:

### 📁 Root `.gitignore` 
Location: `/voicegraph/.gitignore`
- Covers the entire project
- Main focus: environment variables and sensitive files

### 📁 Frontend `.gitignore`
Location: `/voicegraph/frontend/.gitignore`
- Covers Next.js specific files
- More detailed for frontend dependencies

---

## 🚨 Critical Files Being Ignored

### Environment Variables (MUST BE IGNORED!)

These contain your API keys and passwords:

```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

**Your current .env.local contains:**
- ❌ `CEREBRAS_API_KEY` - DO NOT COMMIT
- ❌ `GROQ_API_KEY` - DO NOT COMMIT
- ❌ `NOTION_API_KEY` - DO NOT COMMIT
- ❌ `SMTP_PASSWORD` - DO NOT COMMIT
- ❌ `SMTP_USER` - DO NOT COMMIT

**These are now safely ignored!** ✅

---

## 📦 Build Files Being Ignored

```
node_modules/        # Dependencies (huge, regenerate with npm install)
.next/               # Next.js build output
build/               # Production builds
dist/                # Distribution files
out/                 # Static exports
```

---

## 🖥️ Development Files Being Ignored

```
.vscode/             # VS Code settings
.idea/               # JetBrains IDEs
*.swp, *.swo         # Vim swap files
.DS_Store            # Mac OS files
Thumbs.db            # Windows files
*.log                # Log files
.turbo/              # Turbopack cache
```

---

## 🎯 What SHOULD Be Committed

✅ **Source code:**
- `*.ts`, `*.tsx`, `*.js`, `*.jsx`
- `*.css`, `*.json`

✅ **Configuration (without secrets):**
- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `tailwind.config.js`
- `.env.example` (template without real values)

✅ **Documentation:**
- `README.md`
- `QUICKSTART.md`
- All other `.md` files

✅ **Docker:**
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`

---

## 🚀 Git Commands to Get Started

### Initialize Git (if not done already)

```bash
cd /home/simple-_-/Documents/dev/voicegraph
git init
```

### Check what will be committed

```bash
git status
```

You should NOT see:
- ❌ `.env` or `.env.local`
- ❌ `node_modules/`
- ❌ `.next/`
- ❌ Any `.log` files

### Add files to staging

```bash
# Add all files (gitignore will exclude sensitive ones)
git add .

# Or add specific files
git add frontend/app frontend/components frontend/lib
git add README.md package.json
```

### Commit

```bash
git commit -m "Initial commit: AI Workflow Orchestrator

- Voice-powered workflow automation
- Cerebras AI + Groq Whisper integration
- React Flow visualization
- Real-time execution with SSE
- Docker containerization ready"
```

### Create GitHub repo (optional)

1. Go to https://github.com/new
2. Create a new repository
3. Don't initialize with README (you already have one)
4. Run these commands:

```bash
git remote add origin https://github.com/YOUR_USERNAME/voicegraph.git
git branch -M main
git push -u origin main
```

---

## ⚠️ Before Pushing to GitHub

### Double-check these files are ignored:

```bash
# This should return nothing
git ls-files | grep -E '\.env|\.env\.local'

# This should also return nothing
git ls-files | grep -E 'node_modules|\.next'
```

If you see any `.env` files listed, **STOP** and fix it!

---

## 🔑 Sharing the Project

If someone clones your repo, they'll need to:

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Create their own `.env.local`:**
   ```bash
   cp .env.example .env.local
   # Then edit with their own API keys
   ```

3. **Get their own API keys:**
   - Cerebras: https://cloud.cerebras.ai/
   - Groq: https://console.groq.com/
   - Notion: https://www.notion.so/my-integrations
   - Gmail: App password from Google Account

---

## 🛡️ Security Checklist

- [x] `.gitignore` files created
- [ ] `.env.example` created (template without secrets)
- [ ] Verified no secrets in committed files
- [ ] Added security warning in README
- [ ] Tested `git status` to confirm ignores work

---

## 📝 Sample .env.example (Create This!)

Create this file so others know what variables they need:

```env
# AI Services
CEREBRAS_API_KEY=your_cerebras_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# Notion (optional)
NOTION_API_KEY=your_notion_integration_key_here

# Gmail SMTP (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password-here

# Optional
NODE_ENV=development
```

---

## 🎓 Git Best Practices

1. **Never commit secrets** - Already protected by .gitignore
2. **Commit often** - Small, logical commits
3. **Write clear messages** - Explain what and why
4. **Use branches** - `feature/voice-input`, `fix/loading-spinner`
5. **Review before pushing** - Always check `git diff`

---

## 🆘 If You Accidentally Committed Secrets

**Act fast!**

```bash
# Remove file from git but keep locally
git rm --cached .env.local

# Commit the removal
git commit -m "Remove sensitive env file"

# Force push (if already pushed to GitHub)
git push --force
```

**Then immediately:**
1. 🔑 Regenerate ALL API keys
2. 🔒 Update your `.env.local` with new keys
3. 📧 Check GitHub for exposed secrets
4. 🚫 Consider the old keys compromised

---

**Your secrets are now protected!** 🛡️

Ready to commit when you are! 🚀

