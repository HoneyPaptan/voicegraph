FROM node:18-alpine

# Install required packages
RUN apk add --no-cache curl docker-cli

# Create app directory
WORKDIR /app

# Install MCP Gateway dependencies
RUN npm init -y && \
    npm install express cors body-parser

# Copy MCP Gateway implementation
COPY mcp-gateway-server.js /app/server.js
COPY mcp-gateway-config.json /app/config.json

# Expose MCP Gateway port
EXPOSE 3001

# Start MCP Gateway
CMD ["node", "server.js"]
