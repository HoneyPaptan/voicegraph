# VoiceGraph Frontend 🎤

**Next.js 14 Application for AI-Powered Workflow Automation**

The frontend of VoiceGraph is a modern React application built with Next.js 14, featuring voice-to-workflow conversion, visual workflow building, and real-time execution monitoring.

## ✨ Features

### 🎯 Core UI Components
- **Voice Input**: Real-time speech-to-text with visual feedback
- **Workflow Canvas**: Interactive React Flow-based workflow builder
- **Execution Logs**: Real-time progress tracking with SSE
- **Workflow History**: Complete audit trail of all executions
- **Configuration Modal**: Easy setup for workflow parameters

### 🎨 Design System
- **Vercel Design**: Black and white theme with glass effects
- **Responsive Layout**: Mobile-first design with Tailwind CSS
- **Smooth Animations**: Framer Motion for delightful interactions
- **Dark Mode**: Optimized for developer workflows

### 🔧 Technical Features
- **App Router**: Next.js 14 with server components
- **TypeScript**: Full type safety throughout
- **Real-time Updates**: Server-Sent Events for live execution
- **Background Processing**: Async workflow execution
- **Voice Editing**: Modify workflows using voice commands

## 🏗️ Architecture

### Component Structure
```
frontend/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── WorkflowCanvas.tsx # Main workflow interface
│   ├── VoiceInput.tsx    # Voice recording component
│   └── ExecutionLogs.tsx # Real-time execution display
├── lib/                  # Utilities and integrations
│   ├── cerebras.ts       # Cerebras LLM integration
│   ├── executor.ts       # Workflow execution engine
│   ├── mcp-client.ts     # MCP Gateway client
│   └── types.ts          # TypeScript definitions
└── public/               # Static assets
```

### State Management
- **React Hooks**: useState, useEffect for local state
- **No External State**: No Redux/Zustand (hackathon simplicity)
- **Real-time Updates**: SSE for execution progress
- **Workflow History**: In-memory storage with API persistence

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Environment variables configured

### Installation
```bash
cd frontend
npm install
```

### Environment Variables
Create `.env.local` file:
```bash
# Cerebras AI
NEXT_PUBLIC_CEREBRAS_API_KEY=your_cerebras_api_key_here

# Groq (Speech-to-Text)
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key_here

# Notion Integration
NEXT_PUBLIC_NOTION_API_KEY=your_notion_integration_key_here

# Tavily (Web Search)
NEXT_PUBLIC_TAVILY_API_KEY=your_tavily_api_key_here

# MCP Gateway
NEXT_PUBLIC_MCP_GATEWAY_URL=http://localhost:3001


```

### Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎮 User Interface

### Main Interface
1. **Header**: VoiceGraph branding and navigation
2. **Left Sidebar**: Node library and workflow templates
3. **Canvas**: Interactive workflow builder (React Flow)
4. **Right Panel**: Transcribed text and execution logs
5. **Bottom Bar**: Workflow history and status

### Workflow Creation
1. **Voice Input**: Click mic button and speak
2. **Text Input**: Type your automation needs
3. **Templates**: Use pre-built workflow examples
4. **Visual Builder**: Drag and drop nodes to customize

### Execution Modes
1. **Real-time**: Live execution with SSE streaming
2. **Background**: Async execution with history tracking
3. **Voice Edit**: Modify existing workflows with voice

## 🔧 API Integration

### Core APIs
- **`/api/transcribe`**: Groq Whisper speech-to-text
- **`/api/parse`**: Cerebras LLM workflow parsing
- **`/api/execute`**: Real-time workflow execution
- **`/api/execute-background`**: Direct workflow execution
- **`/api/edit-workflow`**: Voice-based editing

### External Services
- **Cerebras AI**: Workflow parsing and content processing
- **Groq**: Speech-to-text transcription
- **Notion API**: Page and database operations
- **Tavily API**: Web search and data extraction
- **MCP Gateway**: Orchestrated service calls

## 🎨 Styling & Theming

### Design System
- **Colors**: Black and white with glass effects
- **Typography**: System fonts with proper hierarchy
- **Spacing**: Tailwind CSS utility classes
- **Animations**: Framer Motion for smooth transitions

### Component Library
- **shadcn/ui**: Pre-built accessible components
- **Custom Components**: Workflow-specific UI elements
- **Responsive Design**: Mobile-first approach

## 🔄 Real-time Features

### Server-Sent Events (SSE)
- **Live Execution**: Real-time progress updates
- **Node Highlighting**: Visual feedback during execution
- **Error Handling**: Immediate error display
- **Completion Status**: Success/failure indicators

### Background Processing
- **Async Execution**: Non-blocking workflow processing
- **Status Polling**: Regular updates from background tasks
- **History Tracking**: Complete execution audit trail
- **Progress Monitoring**: Visual progress indicators

## 🧪 Testing

### Manual Testing
- **Voice Input**: Test microphone functionality
- **Workflow Creation**: Verify parsing accuracy
- **Execution**: Test both real-time and background modes
- **Error Handling**: Test failure scenarios

### Browser Compatibility
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
# Build image
docker build -t voicegraph-frontend .

# Run container
docker run -p 3000:3000 voicegraph-frontend
```

### Environment Variables (Production)
```bash
# All NEXT_PUBLIC_ variables must be set
NEXT_PUBLIC_CEREBRAS_API_KEY=prod_key
NEXT_PUBLIC_GROQ_API_KEY=prod_key
NEXT_PUBLIC_NOTION_API_KEY=prod_key
NEXT_PUBLIC_TAVILY_API_KEY=prod_key
NEXT_PUBLIC_MCP_GATEWAY_URL=http://mcp-gateway:3001
```

## 🐛 Troubleshooting

### Common Issues

#### Voice Input Not Working
- Check microphone permissions
- Verify Groq API key
- Test with different browsers

#### Workflow Not Parsing
- Check Cerebras API key
- Verify input text quality
- Check console for errors

#### Execution Failing
- Verify MCP Gateway is running
- Check all API keys are valid
- Review execution logs

#### Real-time Updates Not Working
- Check SSE connection
- Verify background processing
- Check browser console

### Debug Tools
- **Browser DevTools**: Console and Network tabs
- **React DevTools**: Component inspection
- **API Testing**: Use curl or Postman
- **Logs**: Check terminal output

## 📱 Mobile Support

### Responsive Design
- **Mobile-First**: Optimized for small screens
- **Touch Gestures**: Swipe and tap interactions
- **Adaptive Layout**: Components adjust to screen size
- **Performance**: Optimized for mobile devices

### Mobile Features
- **Voice Input**: Native microphone access
- **Touch Canvas**: Gesture-based workflow editing
- **Responsive UI**: All components work on mobile
- **Offline Support**: Basic functionality without network

## 🔒 Security

### Client-Side Security
- **API Key Protection**: Environment variables only
- **Input Validation**: Sanitized user inputs
- **XSS Prevention**: React's built-in protection
- **HTTPS**: Secure communication (production)

### Data Handling
- **No Sensitive Data**: Only workflow metadata stored
- **Temporary Storage**: In-memory only
- **API Security**: All calls through secure endpoints
- **User Privacy**: No personal data collection

## 🎯 Performance

### Optimization Strategies
- **Code Splitting**: Dynamic imports for large components
- **Image Optimization**: Next.js automatic optimization
- **Bundle Analysis**: Regular bundle size monitoring
- **Lazy Loading**: Components loaded on demand

### Metrics
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.0s

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- **TypeScript**: Strict type checking
- **ESLint**: Enforced code quality
- **Prettier**: Consistent formatting
- **Conventional Commits**: Standardized commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**VoiceGraph Frontend** - Building the future of voice-driven automation! 🎤✨