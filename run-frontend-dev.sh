#!/bin/bash

# Run Frontend Development Server
echo "🚀 Starting Frontend Development Server..."

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found. Please run this from the project root."
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set environment variables for local development
export MCP_GATEWAY_URL=http://localhost:3001
export INNGEST_EVENT_KEY=dev-key-12345
export INNGEST_SIGNING_KEY=dev-signing-key-67890
export NODE_ENV=development

# Start development server
echo "🌐 Starting Next.js development server on http://localhost:3000"
echo "🔗 MCP Gateway URL: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
