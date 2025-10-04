#!/bin/bash

# Master script to run all development services
echo "🚀 Starting VoiceGraph Development Environment"
echo "=============================================="
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    # Kill background processes
    jobs -p | xargs -r kill
    echo "✅ Cleanup complete"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Set environment variables for local development
export MCP_GATEWAY_URL=http://localhost:3001
export NODE_ENV=development
export INNGEST_EVENT_KEY=dev-key-12345
export INNGEST_SIGNING_KEY=dev-signing-key-67890

# Start MCP Gateway in Docker
echo "🐳 Starting MCP Gateway in Docker..."
./start-services.sh

# Wait a moment for MCP Gateway to be ready
sleep 3

# Start Frontend in background
echo ""
echo "🌐 Starting Frontend Development Server..."
./run-frontend-dev.sh &
FRONTEND_PID=$!

# Start Inngest in background
echo ""
echo "⚡ Starting Inngest Development Server..."
./run-inngest-dev.sh &
INNGEST_PID=$!

echo ""
echo "🎉 All services are starting!"
echo ""
echo "📊 Service URLs:"
echo "   Frontend:    http://localhost:3000"
echo "   MCP Gateway: http://localhost:3001"
echo "   Inngest:     http://localhost:8288"
echo ""
echo "🔍 Health Checks:"
echo "   Frontend:    http://localhost:3000/api/health"
echo "   MCP Gateway: http://localhost:3001/health"
echo "   Inngest:     http://localhost:8288"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for user to stop
wait
