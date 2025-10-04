#!/bin/bash

# Run Inngest Development Server
echo "🚀 Starting Inngest Development Server..."

# Check if Inngest is installed
if ! command -v inngest &> /dev/null; then
    echo "❌ Inngest CLI not found. Installing..."
    npm install -g inngest
fi

# Set environment variables
export INNGEST_DEV=1
export INNGEST_SIGNING_KEY=dev-signing-key-67890
export INNGEST_EVENT_KEY=dev-key-12345
export MCP_GATEWAY_URL=http://localhost:3001
export NODE_ENV=development

# Start Inngest dev server
echo "🌐 Starting Inngest on http://localhost:8288"
inngest dev --port 8288 --host 0.0.0.0
