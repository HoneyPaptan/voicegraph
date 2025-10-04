#!/bin/bash

# Voice Graph Environment Setup Script
echo "🚀 Setting up Voice Graph environment..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Voice Graph Environment Variables
# Fill in your actual API keys below

# Notion API Configuration
NOTION_API_KEY=your_notion_api_key_here
NOTION_DATABASE_ID=your_notion_database_id_here

# Tavily API Configuration  
TAVILY_API_KEY=your_tavily_api_key_here

# SMTP Configuration for Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here

# Inngest Configuration
INNGEST_EVENT_KEY=dev-key-12345
INNGEST_SIGNING_KEY=dev-signing-key-67890
INNGEST_DEV_URL=http://localhost:3000/api/inngest

# MCP Gateway Configuration
MCP_GATEWAY_URL=http://localhost:3001

# Development Environment
NODE_ENV=development
EOF
    echo "✅ .env file created! Please edit it with your actual API keys."
else
    echo "✅ .env file already exists."
fi

# Export environment variables for current session
echo "🔧 Exporting environment variables..."
export $(cat .env | grep -v '^#' | xargs)

echo "📋 Required API Keys:"
echo "   - NOTION_API_KEY: Get from https://www.notion.so/my-integrations"
echo "   - TAVILY_API_KEY: Get from https://tavily.com/"
echo "   - NOTION_DATABASE_ID: Your Notion database ID"
echo ""
echo "🔧 To get your Notion Database ID:"
echo "   1. Open your Notion database in browser"
echo "   2. Copy the ID from the URL (32 character string)"
echo "   3. Example: https://notion.so/your-workspace/DATABASE_ID?v=..."
echo ""
echo "🚀 Next steps:"
echo "   1. Edit .env file with your API keys"
echo "   2. Run: ./start-services.sh"
echo "   3. Or run manually: docker-compose up mcp-gateway"
