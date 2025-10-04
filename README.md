# VoiceGraph 🎤

**AI-Powered Voice-to-Workflow Automation Platform**

Transform your voice commands into automated workflows with visual graph interface. VoiceGraph uses advanced AI to parse natural language, generate executable workflows, and orchestrate complex automation tasks across multiple services.

## ✨ Features

### 🎯 Core Capabilities
- **Voice-to-Workflow**: Speak your automation needs, get visual workflows
- **Visual Workflow Builder**: Drag-and-drop interface with React Flow
- **Real-time Execution**: Live progress tracking with node highlighting
- **Background Processing**: Async execution with complete history tracking
- **Multi-Service Integration**: Notion, Tavily, Email, GitHub, and more

### 🤖 AI-Powered
- **Cerebras LLM**: Ultra-fast workflow parsing and content processing
- **Groq Whisper**: High-quality speech-to-text transcription
- **Smart Parsing**: Natural language understanding for complex workflows

### 🔧 Technical Features
- **Docker MCP Gateway**: Secure orchestration of AI tools
- **Parallel Execution**: Optimized workflow processing
- **Real-time Streaming**: Live execution logs and progress updates
- **Workflow History**: Complete audit trail of all executions
- **Voice Editing**: Modify workflows using voice commands

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   MCP Gateway    │    │   AI Services   │
│   (Next.js)     │◄──►│   (Docker)       │◄──►│   (Cerebras)    │
│                 │    │                  │    │   (Groq)        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Workflow      │    │   Notion API     │    │   Tavily API    │
│   Execution     │    │   Integration    │    │   Integration   │
│   Engine        │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow
1. **Voice Input** → Groq Whisper → Text
2. **Text** → Cerebras LLM → Workflow JSON
3. **Workflow** → React Flow → Visual Graph
4. **Execution** → MCP Gateway → Service APIs
5. **Results** → Real-time UI Updates

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- API Keys (see Environment Variables)

### 1. Clone Repository
```bash
git clone <repository-url>
cd voicegraph
```

### 2. Environment Setup
Create `.env` file in the root directory:
```bash
# Cerebras AI (Required for prize eligibility)
CEREBRAS_API_KEY=your_cerebras_api_key_here

# Groq (Speech-to-Text)
GROQ_API_KEY=your_groq_api_key_here

# Notion Integration
NOTION_API_KEY=your_notion_integration_key_here

# Tavily (Web Search)
TAVILY_API_KEY=your_tavily_api_key_here

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# MCP Gateway
MCP_GATEWAY_URL=http://localhost:3001

# Development
NODE_ENV=development
```

### 3. Start Services

#### Option A: Docker Compose (Recommended)
```bash
# Start MCP Gateway in Docker
docker-compose up -d

# Start Frontend locally
cd frontend
npm run dev
```

#### Option B: Individual Services
```bash
# Terminal 1: MCP Gateway (Docker)
docker-compose up mcp-gateway

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Background Processing (Optional)
cd frontend
npx inngest-cli@latest dev
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **MCP Gateway**: http://localhost:3001
- **Inngest Dashboard**: http://localhost:8288 (if running)

## 🐳 Docker Deployment

### Full Stack Deployment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services Included
- **MCP Gateway**: Orchestrates AI tools and APIs
- **Frontend**: Next.js application (if enabled)

## 🎮 How to Use

### 1. Create a Workflow
- **Voice**: Click mic button and speak your automation needs
- **Text**: Type your requirements in the text input
- **Templates**: Use pre-built workflow templates

### 2. Configure Workflow
- Enter required parameters (Notion page IDs, email addresses, etc.)
- Review the generated workflow graph
- Modify nodes if needed

### 3. Execute Workflow
- **Real-time**: Click "Run Workflow" for live execution
- **Background**: Toggle "Background Execution" for async processing
- **Monitor**: Watch real-time progress and logs

### 4. View Results
- **Execution Logs**: Real-time progress updates
- **Workflow History**: Complete audit trail
- **Node Status**: Visual indicators for success/failure

## 🔧 API Endpoints

### Core APIs
- `POST /api/transcribe` - Speech-to-text conversion
- `POST /api/parse` - Natural language to workflow parsing
- `POST /api/execute` - Real-time workflow execution
- `POST /api/execute-background` - Background workflow execution
- `POST /api/edit-workflow` - Voice-based workflow editing

### Health & Monitoring
- `GET /api/health` - System health check
- `GET /api/workflow-history` - Execution history
- `GET /api/test-inngest` - Inngest connection test

## 🛠️ Development

### Project Structure
```
voicegraph/
├── frontend/                 # Next.js application
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and integrations
│   └── public/              # Static assets
├── mcp-gateway/             # Docker MCP Gateway
├── docker-compose.yml       # Docker services
└── README.md               # This file
```

### Key Technologies
- **Frontend**: Next.js 14, React 18, Tailwind CSS, React Flow
- **Backend**: Node.js, Express.js, Server-Sent Events
- **AI**: Cerebras LLM, Groq Whisper
- **Integrations**: Notion API, Tavily API, SMTP
- **Infrastructure**: Docker, MCP Gateway

### Development Commands
```bash
# Start MCP Gateway
docker-compose up -d

# Start Frontend
cd frontend && npm run dev

# Start Background Processing
cd frontend && npx inngest-cli@latest dev

# Test connections
curl http://localhost:3000/api/health
curl http://localhost:3001/health
```

## 🎯 Workflow Examples

### Example 1: Notion to Email
**Voice**: "Get my Notion meeting notes and email me a summary"
**Workflow**:
1. Fetch Notion page
2. Summarize content with AI
3. Send email with summary

### Example 2: Web Research
**Voice**: "Research hotels in Paris and create a Notion page with the results"
**Workflow**:
1. Search web for hotels
2. Process and format data
3. Create Notion page with results

### Example 3: Multi-Step Automation
**Voice**: "Find trending topics, research them, and send a daily digest"
**Workflow**:
1. Search for trending topics
2. Research each topic
3. Summarize findings
4. Create formatted report
5. Send email digest

## 🔒 Security

### API Key Management
- All API keys stored in environment variables
- No hardcoded credentials in codebase
- Secure Docker container isolation

### MCP Gateway Security
- Isolated Docker containers
- Restricted network access
- Secure credential handling

## 🐛 Troubleshooting

### Common Issues

#### Workflow Stuck in "Pending"
- Check MCP Gateway is running: `curl http://localhost:3001/health`
- Verify API keys are set correctly
- Check console logs for errors

#### Voice Input Not Working
- Ensure microphone permissions are granted
- Check Groq API key is valid
- Verify network connectivity

#### Background Execution Issues
- Check Inngest dev server is running
- Verify workflow history API is accessible
- Check console logs for detailed errors

### Debug Commands
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f mcp-gateway

# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3001/health
```

## 📊 Monitoring

### Health Checks
- **Frontend**: http://localhost:3000/api/health
- **MCP Gateway**: http://localhost:3001/health
- **Inngest**: http://localhost:8288 (if running)

### Logs
- **Frontend**: Browser console + terminal
- **MCP Gateway**: `docker-compose logs mcp-gateway`
- **Background**: Inngest dashboard

## 🏆 Prize Eligibility

This project is designed for hackathon competition with the following sponsor requirements:

### Cerebras AI (Required)
- Primary LLM for workflow parsing
- Content processing and summarization
- Models: llama-4-scout-17b-16e-instruct

### Docker MCP Gateway
- Containerized MCP server orchestration
- Secure tool management
- Enterprise-grade isolation

### Meta Llama (Automatic)
- Using Llama models through Cerebras
- Covered by Cerebras integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request



## 🙏 Acknowledgments

- **Cerebras AI** for ultra-fast LLM inference
- **Groq** for high-quality speech-to-text
- **Docker** for MCP Gateway orchestration
- **Notion** and **Tavily** for API integrations
- **React Flow** for workflow visualization

---

**VoiceGraph** - Transform your voice into powerful automation workflows! 🎤✨
