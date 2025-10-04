#!/bin/bash

# VoiceGraph Service Startup Script
# Ensures proper orchestration of MCP Gateway, Inngest, and Frontend services

set -e

echo "🚀 Starting VoiceGraph Services..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ docker-compose is not installed. Please install docker-compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cat > .env << EOF
# Cerebras AI
CEREBRAS_API_KEY=your_cerebras_key_here

# Groq (for Whisper)
GROQ_API_KEY=your_groq_key_here

# Notion
NOTION_API_KEY=your_notion_key_here

# Tavily
TAVILY_API_KEY=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

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Inngest
INNGEST_EVENT_KEY=default-event-key
INNGEST_SIGNING_KEY=default-signing-key

# MCP Gateway
MCP_GATEWAY_URL=http://localhost:3001
EOF
    echo "⚠️  Please update .env file with your actual API keys before running again."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."

# Wait for MCP Gateway
echo "🔧 Waiting for MCP Gateway..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ MCP Gateway is ready"
        break
    fi
    sleep 2
    timeout=$((timeout - 2))
done

if [ $timeout -le 0 ]; then
    echo "❌ MCP Gateway failed to start within 60 seconds"
    docker-compose logs mcp-gateway
    exit 1
fi

# Note: Frontend and Inngest should be run separately
echo "ℹ️  Note: Run Frontend locally with: cd frontend && npm run dev"
echo "ℹ️  Note: Run Inngest separately with: ./run-inngest-dev.sh"

echo ""
echo "🎉 MCP Gateway is running!"
echo ""
echo "📊 Service URLs:"
echo "   MCP Gateway: http://localhost:3001"
echo "   Frontend:    Run locally with: cd frontend && npm run dev"
echo "   Inngest:     Run locally with: ./run-inngest-dev.sh"
echo ""
echo "🔍 Health Checks:"
echo "   MCP Gateway: http://localhost:3001/health"
echo "   Inngest:     http://localhost:8288 (when running locally)"
echo ""
echo "📝 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose down"
echo ""

# Show service status
echo "📋 Service Status:"
docker-compose ps
