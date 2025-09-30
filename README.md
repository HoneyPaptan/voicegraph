# AI Workflow Orchestrator

A voice-powered workflow automation system that converts natural language commands into visual, executable workflows. Built for speed and simplicity with cutting-edge AI technologies.

## 🚀 Features

- **Voice Input**: Speak your workflow using Groq Whisper (12x faster than OpenAI)
- **AI-Powered Parsing**: Cerebras AI with Llama models instantly understands your intent
- **Visual Workflow**: Beautiful animated graph visualization with React Flow
- **Real-time Execution**: Server-Sent Events stream logs as workflows execute
- **Smart Integrations**: Connect Notion pages, AI processing, and email delivery
- **Docker Ready**: One-command deployment with docker-compose

## 🏗️ Architecture

```
Voice Input → Groq Whisper → Cerebras Parser → React Flow Graph
                                                        ↓
                                                   Execute Button
                                                        ↓
                                  Notion → Cerebras LLM → Email → SSE Logs
```

## 📦 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **Tailwind CSS v4** - Modern styling
- **shadcn/ui** - Beautiful UI components
- **React Flow** - Workflow visualization
- **Framer Motion** - Smooth animations

### AI Services
- **Cerebras AI** - Ultra-fast LLM inference (Llama models)
- **Groq Whisper** - Speech-to-text transcription
- **Vercel AI SDK** - Unified AI interface

### Integrations
- **Notion API** - Fetch pages and databases
- **Nodemailer** - Send emails via SMTP

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- API Keys:
  - Cerebras API key
  - Groq API key
  - Notion integration token (optional)
  - Gmail app password (optional)

### Local Development

1. **Clone and install dependencies:**
```bash
cd frontend
npm install
```

2. **Configure environment variables:**
```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local with your API keys
```

3. **Run development server:**
```bash
npm run dev
```

4. **Open browser:**
Navigate to `http://localhost:3000`

### Docker Deployment

1. **Set environment variables:**
```bash
# Create .env file in root directory
cp .env.example .env

# Edit .env with your API keys
```

2. **Build and run with Docker Compose:**
```bash
docker-compose up --build
```

3. **Access application:**
Navigate to `http://localhost:3000`

4. **Check health status:**
```bash
curl http://localhost:3000/api/health
```

## 📝 Usage

### Creating a Workflow

1. **Click "Start Recording"** - Grant microphone permissions
2. **Speak your command**, for example:
   - "Get my Notion meeting notes and email me a summary"
   - "Fetch my Notion project tasks and send me a status update"
3. **Watch the workflow generate** - Cerebras AI parses your intent
4. **Configure parameters** - Enter Notion IDs and email address
5. **Run the workflow** - See real-time execution logs

### Example Workflows

#### Meeting Notes Summary
```
Input: "Get my Notion meeting notes and email me a summary"
Flow: Notion Fetch → Cerebras Summarize → Email Send
```

#### Project Status Update
```
Input: "Fetch my Notion project tasks and send me a status update"
Flow: Notion Database → Cerebras Analyze → Email Send
```

#### Weekly Insights
```
Input: "Get my weekly Notion journal and email me key insights"
Flow: Notion Fetch → Cerebras Extract → Email Send
```

## 🔧 API Endpoints

- `POST /api/transcribe` - Transcribe audio to text (Groq Whisper)
- `POST /api/parse` - Parse text to workflow JSON (Cerebras)
- `POST /api/execute` - Execute workflow with SSE streaming
- `GET /api/health` - Health check for Docker monitoring

## 🐳 Docker Configuration

### Services
- **frontend** - Next.js application on port 3000

### Health Checks
The frontend service includes health monitoring:
- Endpoint: `http://localhost:3000/api/health`
- Interval: 30 seconds
- Retries: 3

### Networks
All services run on an isolated bridge network for security.

## 🎯 Sponsor Technology Usage

### Cerebras AI ✅
- **Primary LLM** for workflow parsing
- **Content processing** for summarization and analysis
- **Models**: Llama-4-Scout-17b-16e-instruct
- **Speed**: Sub-second inference times

### Meta Llama ✅
- Using Llama models through Cerebras inference
- Powers natural language understanding
- Enables intelligent workflow generation

### Docker ✅
- **Full containerization** with docker-compose
- **Health monitoring** with automated checks
- **Production-ready** multi-stage builds
- **One-command deployment**

## ⚡ Performance

- **Transcription**: ~2-3 seconds for 10-second audio
- **Workflow Parsing**: ~0.5-1 second with Cerebras
- **Execution**: Depends on workflow complexity
- **Total Demo Flow**: ~5-10 seconds end-to-end

## 🔒 Security Notes

- Never commit `.env` files
- Use environment variables for all secrets
- Enable Gmail 2FA and use app-specific passwords
- Notion integration requires proper token scoping

## 🐛 Troubleshooting

### Microphone not working
- Check browser permissions
- Ensure HTTPS (or localhost)
- Try different browser

### Transcription fails
- Verify GROQ_API_KEY is set
- Check audio format (WebM supported)
- Check API quota/limits

### Workflow parsing fails
- Verify CEREBRAS_API_KEY is set
- Try rephrasing command
- Check API logs for errors

### Docker build fails
- Ensure Node.js 18+ is used in Dockerfile
- Check for missing dependencies
- Verify .dockerignore is set up

## 📄 Environment Variables

See `.env.example` for complete list of required variables:

| Variable | Required | Description |
|----------|----------|-------------|
| CEREBRAS_API_KEY | Yes | Cerebras AI API key |
| GROQ_API_KEY | Yes | Groq Cloud API key |
| NOTION_API_KEY | Optional | Notion integration token |
| SMTP_HOST | Optional | SMTP server (e.g., smtp.gmail.com) |
| SMTP_PORT | Optional | SMTP port (587 for TLS) |
| SMTP_USER | Optional | Email address |
| SMTP_PASSWORD | Optional | Email app password |

## 🎨 UI Features

- **Dark Mode** - Modern glassmorphism design
- **Animated Nodes** - Staggered fade-in effects
- **Real-time Updates** - Active node highlighting during execution
- **Responsive Layout** - Works on desktop and tablet
- **Error Handling** - Graceful error messages with retry options

## 📦 Project Structure

```
voicegraph/
├── frontend/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Main page
│   ├── components/        # React components
│   ├── lib/
│   │   ├── tools/         # Notion, Email integrations
│   │   ├── cerebras.ts    # Cerebras AI utilities
│   │   ├── executor.ts    # Workflow executor
│   │   └── types.ts       # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🤝 Contributing

This is a hackathon project built in 5 days. Contributions welcome!

## 📝 License

MIT License - feel free to use for your own projects!

## 🎉 Acknowledgments

- **Cerebras** - Ultra-fast LLM inference
- **Groq** - Lightning-fast Whisper API
- **Meta** - Llama models
- **Vercel** - AI SDK and Next.js
- **React Flow** - Beautiful workflow visualization

---

Built with ❤️ for AI automation enthusiasts

