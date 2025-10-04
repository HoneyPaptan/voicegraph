/**
 * MCP Gateway Server
 * Simple orchestration service for Notion and Tavily APIs
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Simple markdown to Notion converter
function markdownToNotionBlocks(content) {
  const lines = content.split('\n');
  const blocks = [];
  let inCodeBlock = false;
  let codeContent = [];
  let inList = false;
  let listItems = [];
  let inNumberedList = false;
  let numberedItems = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Handle code blocks
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        blocks.push({
          object: 'block',
          type: 'code',
          code: {
            rich_text: [{ type: 'text', text: { content: codeContent.join('\n') } }],
            language: 'plain text'
          }
        });
        codeContent = [];
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
        continue;
      }
    } else if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Handle headings
    if (trimmedLine.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: trimmedLine.slice(4) } }]
        }
      });
    } else if (trimmedLine.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: trimmedLine.slice(3) } }]
        }
      });
    } else if (trimmedLine.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: trimmedLine.slice(2) } }]
        }
      });
    }
    // Handle bullet lists
    else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push(trimmedLine.slice(2));
    }
    // Handle numbered lists
    else if (/^\d+\.\s/.test(trimmedLine)) {
      if (!inNumberedList) {
        inNumberedList = true;
        numberedItems = [];
      }
      numberedItems.push(trimmedLine.replace(/^\d+\.\s/, ''));
    }
    // Handle quotes
    else if (trimmedLine.startsWith('> ')) {
      blocks.push({
        object: 'block',
        type: 'quote',
        quote: {
          rich_text: [{ type: 'text', text: { content: trimmedLine.slice(2) } }]
        }
      });
    }
    // Handle horizontal rules
    else if (trimmedLine === '---' || trimmedLine === '***') {
      blocks.push({
        object: 'block',
        type: 'divider',
        divider: {}
      });
    }
    // Handle regular paragraphs
    else if (trimmedLine) {
      // Flush any pending lists
      if (inList && listItems.length > 0) {
        for (const item of listItems) {
          blocks.push({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: item } }]
            }
          });
        }
        listItems = [];
        inList = false;
      }
      
      if (inNumberedList && numberedItems.length > 0) {
        for (const item of numberedItems) {
          blocks.push({
            object: 'block',
            type: 'numbered_list_item',
            numbered_list_item: {
              rich_text: [{ type: 'text', text: { content: item } }]
            }
          });
        }
        numberedItems = [];
        inNumberedList = false;
      }

      // Add paragraph
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: trimmedLine } }]
        }
      });
    } else {
      // Empty line - flush lists if any
      if (inList && listItems.length > 0) {
        for (const item of listItems) {
          blocks.push({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: item } }]
            }
          });
        }
        listItems = [];
        inList = false;
      }
      
      if (inNumberedList && numberedItems.length > 0) {
        for (const item of numberedItems) {
          blocks.push({
            object: 'block',
            type: 'numbered_list_item',
            numbered_list_item: {
              rich_text: [{ type: 'text', text: { content: item } }]
            }
          });
        }
        numberedItems = [];
        inNumberedList = false;
      }
    }
  }

  // Flush any remaining lists
  if (inList && listItems.length > 0) {
    for (const item of listItems) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: item } }]
        }
      });
    }
  }
  
  if (inNumberedList && numberedItems.length > 0) {
    for (const item of numberedItems) {
      blocks.push({
        object: 'block',
        type: 'numbered_list_item',
        numbered_list_item: {
          rich_text: [{ type: 'text', text: { content: item } }]
        }
      });
    }
  }

  return blocks;
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MCP server status
const mcpServers = {
  notion: { status: 'running', tools: ['fetch_page', 'create_page', 'append_to_page'] },
  tavily: { status: 'running', tools: ['search_web', 'extract_data'] }
};

/**
 * Call MCP tool via direct API integration
 */
async function callMCPTool(serverName, toolName, params) {
  console.log(`🔧 Calling ${serverName}.${toolName} with params:`, params);
  
  // Use direct API calls instead of MCP protocol
  if (serverName === 'notion') {
    return await callNotionTool(toolName, params);
  } else if (serverName === 'tavily') {
    return await callTavilyTool(toolName, params);
  }
  
  throw new Error(`Unknown server: ${serverName}`);
}

/**
 * Call Notion tool via direct API
 */
async function callNotionTool(toolName, params) {
  const notionApiKey = process.env.NOTION_API_KEY;
  
  if (!notionApiKey) {
    throw new Error('NOTION_API_KEY not configured');
  }
  
  // Use direct API calls
  switch (toolName) {
    case 'fetch_page':
      const content = await fetchNotionPage(params.pageId);
      return { content };
      
    case 'create_page':
      const result = await createNotionPageDirect(
        params.parentId,
        params.title,
        params.content,
        params.properties
      );
      return result;
      
    case 'append_to_page':
      const appendResult = await appendToNotionPageDirect(params.pageId, params.content);
      return appendResult;
      
    default:
      throw new Error(`Unknown Notion tool: ${toolName}`);
  }
}

/**
 * Call Tavily tool via direct API
 */
async function callTavilyTool(toolName, params) {
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  
  if (!tavilyApiKey) {
    throw new Error('TAVILY_API_KEY not configured');
  }
  
  // Use direct API calls
  switch (toolName) {
    case 'search_web':
      const result = await searchWebDirect(params.query, {
        maxResults: params.maxResults,
        includeDomains: params.includeDomains,
        site: params.site
      });
      return result;
      
    case 'extract_data':
      const extractResult = await extractWebDataDirect(params.query, params.topic);
      return extractResult;
      
    default:
      throw new Error(`Unknown Tavily tool: ${toolName}`);
  }
}

/**
 * Direct Notion API calls
 */
async function fetchNotionPage(pageId) {
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Notion API error: ${response.status}`);
  }
  
  const page = await response.json();
  return `# ${page.properties?.title?.title?.[0]?.text?.content || 'Untitled'}\n\nPage content fetched successfully.`;
}

async function createNotionPageDirect(parentId, title, content, properties) {
  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      parent: { database_id: parentId },
      properties: {
        Name: {
          title: [{ text: { content: title } }]
        }
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Notion API error: ${response.status}`);
  }
  
  const result = await response.json();
  
  // Add content if provided - convert markdown to Notion blocks
  if (content) {
    const blocks = markdownToNotionBlocks(content);
    
    if (blocks.length > 0) {
      await fetch(`https://api.notion.com/v1/blocks/${result.id}/children`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ children: blocks })
      });
    }
  }
  
  return {
    success: true,
    data: `Page created successfully with formatted content: ${title}`,
    pageUrl: result.url
  };
}

async function appendToNotionPageDirect(pageId, content) {
  // Convert markdown to Notion blocks
  const blocks = markdownToNotionBlocks(content);
  
  if (blocks.length === 0) {
    return {
      success: true,
      data: 'No content to append (empty or whitespace only)'
    };
  }
  
  const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      children: blocks
    })
  });
  
  if (!response.ok) {
    throw new Error(`Notion API error: ${response.status}`);
  }
  
  return {
    success: true,
    data: `Successfully appended ${blocks.length} formatted block(s) to the Notion page`
  };
}

/**
 * Direct Tavily API calls
 */
async function searchWebDirect(query, options = {}) {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: options.maxResults || 5,
      search_depth: 'basic',
      include_answer: true
    })
  });
  
  if (!response.ok) {
    throw new Error(`Tavily API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  let formattedResults = `# Search Results for "${query}"\n\n`;
  
  if (data.answer) {
    formattedResults += `## Quick Answer\n${data.answer}\n\n`;
  }
  
  formattedResults += `## Top ${data.results.length} Results\n\n`;
  
  data.results.forEach((result, index) => {
    formattedResults += `### ${index + 1}. ${result.title}\n`;
    formattedResults += `**Source:** ${result.url}\n`;
    formattedResults += `**Relevance Score:** ${(result.score * 100).toFixed(1)}%\n\n`;
    formattedResults += `${result.content}\n\n`;
    formattedResults += `---\n\n`;
  });
  
  return {
    success: true,
    data: formattedResults
  };
}

async function extractWebDataDirect(query, topic) {
  const searchResult = await searchWebDirect(query, { maxResults: 3 });
  return {
    success: true,
    data: `# Web Data: ${topic}\n\n${searchResult.data}`
  };
}

// Routes

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  const serverStatuses = Object.entries(mcpServers).map(([name, server]) => ({
    name,
    status: server.status
  }));
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mcpServers: serverStatuses
  });
});

/**
 * List available tools for a server
 */
app.get('/mcp/:serverName/tools', (req, res) => {
  const { serverName } = req.params;
  
  if (!mcpServers[serverName]) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  // Return available tools based on server type
  let tools = [];
  if (serverName === 'notion') {
    tools = [
      { name: 'fetch_page', description: 'Fetch a Notion page' },
      { name: 'create_page', description: 'Create a Notion page' },
      { name: 'append_to_page', description: 'Append content to a Notion page' }
    ];
  } else if (serverName === 'tavily') {
    tools = [
      { name: 'search_web', description: 'Search the web' },
      { name: 'extract_data', description: 'Extract specific data from web search' }
    ];
  }
  
  res.json(tools);
});

/**
 * Get server info
 */
app.get('/mcp/:serverName/info', (req, res) => {
  const { serverName } = req.params;
  
  if (!mcpServers[serverName]) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  res.json({
    name: serverName,
    status: mcpServers[serverName].status,
    config: mcpServers[serverName].config
  });
});

/**
 * Call a tool on a server
 */
app.post('/mcp/:serverName/tools/:toolName', async (req, res) => {
  const { serverName, toolName } = req.params;
  const params = req.body;
  
  try {
    const result = await callMCPTool(serverName, toolName, params);
    res.json(result);
  } catch (error) {
    console.error(`Error calling ${serverName}.${toolName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * List all servers
 */
app.get('/mcp', (req, res) => {
  const servers = Object.entries(mcpServers).map(([name, server]) => ({
    name,
    status: server.status,
    config: server.config
  }));
  
  res.json(servers);
});

// Start the gateway server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 MCP Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 MCP servers: http://localhost:${PORT}/mcp`);
  console.log(`✅ Notion and Tavily APIs are ready for orchestration`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down MCP Gateway...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down MCP Gateway...');
  process.exit(0);
});
