# MCP Integration Guide 🚀

## Overview

VoiceGraph now uses **Docker MCP Gateway** to orchestrate MCP (Model Context Protocol) servers for Notion and Tavily integrations. This provides better reliability, scalability, and follows the MCP standard for AI tool integration.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  MCP Gateway    │    │  MCP Servers    │
│   (Next.js)     │◄──►│   (Docker)      │◄──►│   (Notion/Tavily)│
│   Port: 3000    │    │   Port: 3001    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│    Inngest      │    │   Health Checks │
│  Background     │    │   & Monitoring  │
│  Port: 8288     │    │                 │
└─────────────────┘    └─────────────────┘
```

## Services

### 1. MCP Gateway (`mcp-gateway`)
- **Port:** 3001
- **Purpose:** Orchestrates MCP servers for Notion and Tavily
- **Configuration:** `mcp-gateway/mcp-gateway-config.json`
- **Health Check:** `http://localhost:3001/health`

### 2. Frontend (`frontend`)
- **Port:** 3000
- **Purpose:** Main application with MCP client integration
- **MCP Integration:** Uses MCP clients with fallback to direct APIs
- **Health Check:** `http://localhost:3000/api/health`

### 3. Inngest (`inngest`)
- **Port:** 8288
- **Purpose:** Background workflow processing
- **Health Check:** `http://localhost:8288/health`

## MCP Client Integration

### Notion MCP Client
```typescript
import { notionMCP } from './lib/mcp-client';

// Fetch page
const result = await notionMCP.fetchPage(pageId);

// Create page
const result = await notionMCP.createPage({
  parentId: 'database-id',
  title: 'Page Title',
  content: 'Page content'
});

// Append to page
const result = await notionMCP.appendToPage(pageId, content);
```

### Tavily MCP Client
```typescript
import { tavilyMCP } from './lib/mcp-client';

// Search web
const result = await tavilyMCP.searchWeb(query, {
  maxResults: 5,
  includeDomains: ['example.com'],
  site: 'github.com'
});

// Extract data
const result = await tavilyMCP.extractData(query, topic);
```

## Fallback Strategy

The integration includes **automatic fallback** to direct API calls if MCP fails:

1. **Primary:** Try MCP client call
2. **Fallback:** If MCP fails, use direct API call
3. **Error:** If both fail, throw error with details

This ensures **100% reliability** even if MCP Gateway is down.

## Environment Variables

```bash
# Required for MCP Gateway
NOTION_API_KEY=your_notion_key
TAVILY_API_KEY=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

# MCP Gateway URL (for frontend)
MCP_GATEWAY_URL=http://mcp-gateway:3001

# Inngest
INNGEST_EVENT_KEY=default-event-key
INNGEST_SIGNING_KEY=default-signing-key
```

## Quick Start

### 1. Start All Services
```bash
./start-services.sh
```

### 2. Manual Start
```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Health Checks
```bash
# Check all services
curl http://localhost:3000/api/health

# Check MCP Gateway specifically
curl http://localhost:3000/api/mcp-health

# Check individual services
curl http://localhost:3001/health  # MCP Gateway
curl http://localhost:3000/api/health  # Frontend
curl http://localhost:8288/health  # Inngest
```

## MCP Server Configuration

### Notion MCP Server
```json
{
  "notion": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-notion"],
    "env": {
      "NOTION_API_KEY": "${NOTION_API_KEY}"
    }
  }
}
```

### Tavily MCP Server
```json
{
  "tavily": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-tavily"],
    "env": {
      "TAVILY_API_KEY": "${TAVILY_API_KEY}"
    }
  }
}
```

## Workflow Execution

### With MCP Integration
1. **Voice Input** → Transcribed text
2. **Cerebras AI** → Parse workflow JSON
3. **MCP Gateway** → Route to appropriate MCP server
4. **MCP Server** → Execute Notion/Tavily operations
5. **Results** → Return to frontend
6. **Inngest** → Background processing (optional)

### Fallback Flow
1. **Voice Input** → Transcribed text
2. **Cerebras AI** → Parse workflow JSON
3. **Direct API** → Call Notion/Tavily APIs directly
4. **Results** → Return to frontend

## Monitoring & Debugging

### Service Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f mcp-gateway
docker-compose logs -f frontend
docker-compose logs -f inngest
```

### MCP Debugging
```bash
# Check MCP server status
curl http://localhost:3001/mcp/notion/info
curl http://localhost:3001/mcp/tavily/info

# List available tools
curl http://localhost:3001/mcp/notion/tools
curl http://localhost:3001/mcp/tavily/tools
```

### Health Monitoring
```bash
# Comprehensive health check
curl http://localhost:3000/api/health | jq

# MCP-specific health
curl http://localhost:3000/api/mcp-health | jq
```

## Troubleshooting

### Common Issues

1. **MCP Gateway not starting**
   ```bash
   # Check logs
   docker-compose logs mcp-gateway
   
   # Check if ports are available
   netstat -tulpn | grep :3001
   ```

2. **MCP servers not connecting**
   ```bash
   # Check MCP Gateway health
   curl http://localhost:3001/health
   
   # Check individual MCP servers
   curl http://localhost:3001/mcp/notion/info
   curl http://localhost:3001/mcp/tavily/info
   ```

3. **API keys not working**
   ```bash
   # Verify environment variables
   docker-compose exec frontend env | grep -E "(NOTION|TAVILY)_API_KEY"
   ```

### Reset Everything
```bash
# Stop and remove all containers
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
./start-services.sh
```

## Benefits of MCP Integration

1. **Standardization:** Uses MCP protocol for AI tool integration
2. **Reliability:** Automatic fallback to direct APIs
3. **Scalability:** Easy to add new MCP servers
4. **Monitoring:** Built-in health checks and logging
5. **Docker Native:** Full containerization with orchestration
6. **Development:** Easy local development with hot reload

## Next Steps

1. **Add More MCP Servers:** GitHub, Slack, Google Calendar
2. **Enhanced Monitoring:** Prometheus metrics, Grafana dashboards
3. **Load Balancing:** Multiple MCP Gateway instances
4. **Security:** Authentication and authorization for MCP servers
5. **Caching:** Redis cache for MCP responses

## Support

- **Documentation:** This file and inline code comments
- **Logs:** `docker-compose logs -f` for debugging
- **Health Checks:** Built-in endpoints for monitoring
- **Fallback:** Automatic fallback ensures reliability
