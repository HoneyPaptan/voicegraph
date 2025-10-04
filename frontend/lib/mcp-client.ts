/**
 * MCP Client Integration Layer
 * Orchestrates MCP servers through Docker MCP Gateway
 */

interface MCPRequest {
  method: string;
  params?: any;
}

interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

interface MCPClient {
  callTool(serverName: string, toolName: string, params: any): Promise<any>;
  listTools(serverName: string): Promise<string[]>;
  getServerInfo(serverName: string): Promise<any>;
}

class MCPGatewayClient implements MCPClient {
  private gatewayUrl: string;

  constructor() {
    // Use localhost for local development, mcp-gateway for Docker
    this.gatewayUrl = process.env.MCP_GATEWAY_URL || 
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'http://mcp-gateway:3001');
    
    console.log(`🔗 MCP Client initialized with gateway URL: ${this.gatewayUrl}`);
  }

  /**
   * Call a tool on a specific MCP server
   */
  async callTool(serverName: string, toolName: string, params: any): Promise<any> {
    try {
      console.log(`🔧 MCP: Calling ${serverName}.${toolName}`, params);

      const response = await fetch(`${this.gatewayUrl}/mcp/${serverName}/tools/${toolName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MCP Gateway error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ MCP: ${serverName}.${toolName} completed`);
      return result;
    } catch (error: any) {
      console.error(`❌ MCP: ${serverName}.${toolName} failed:`, error);
      throw new Error(`MCP tool call failed: ${error.message}`);
    }
  }

  /**
   * List available tools on a server
   */
  async listTools(serverName: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.gatewayUrl}/mcp/${serverName}/tools`);
      
      if (!response.ok) {
        throw new Error(`Failed to list tools: ${response.status}`);
      }

      const tools = await response.json();
      return tools.map((tool: any) => tool.name);
    } catch (error: any) {
      console.error(`❌ MCP: Failed to list tools for ${serverName}:`, error);
      return [];
    }
  }

  /**
   * Get server information
   */
  async getServerInfo(serverName: string): Promise<any> {
    try {
      const response = await fetch(`${this.gatewayUrl}/mcp/${serverName}/info`);
      
      if (!response.ok) {
        throw new Error(`Failed to get server info: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`❌ MCP: Failed to get info for ${serverName}:`, error);
      return null;
    }
  }
}

// Create singleton instance
const mcpClient = new MCPGatewayClient();

export default mcpClient;

/**
 * Notion MCP Integration
 */
export class NotionMCPClient {
  private client: MCPClient;

  constructor() {
    this.client = mcpClient;
  }

  /**
   * Fetch a Notion page using MCP
   */
  async fetchPage(pageId: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const result = await this.client.callTool('notion', 'fetch_page', {
        pageId: pageId
      });

      return {
        success: true,
        data: result.content || 'Empty page'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch a Notion database using MCP
   */
  async fetchDatabase(databaseId: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const result = await this.client.callTool('notion', 'fetch_database', {
        databaseId: databaseId
      });

      return {
        success: true,
        data: result.content || 'Empty database'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a Notion page using MCP
   */
  async createPage(params: {
    parentId?: string;
    title: string;
    content?: string;
    properties?: Record<string, any>;
  }): Promise<{ success: boolean; data?: string; error?: string; pageUrl?: string }> {
    try {
      const result = await this.client.callTool('notion', 'create_page', params);

      return {
        success: true,
        data: result.message || 'Page created successfully',
        pageUrl: result.pageUrl
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Append content to a Notion page using MCP
   */
  async appendToPage(pageId: string, content: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const result = await this.client.callTool('notion', 'append_to_page', {
        pageId: pageId,
        content: content
      });

      return {
        success: true,
        data: result.message || 'Content appended successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

/**
 * Tavily MCP Integration
 */
export class TavilyMCPClient {
  private client: MCPClient;

  constructor() {
    this.client = mcpClient;
  }

  /**
   * Search the web using Tavily MCP
   */
  async searchWeb(query: string, options: {
    maxResults?: number;
    includeDomains?: string[];
    site?: string;
  } = {}): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const result = await this.client.callTool('tavily', 'search_web', {
        query: query,
        maxResults: options.maxResults || 5,
        includeDomains: options.includeDomains,
        site: options.site
      });

      return {
        success: true,
        data: result.content || 'No results found'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract specific data using Tavily MCP
   */
  async extractData(query: string, topic: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const result = await this.client.callTool('tavily', 'extract_data', {
        query: query,
        topic: topic
      });

      return {
        success: true,
        data: result.content || 'No data extracted'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instances
export const notionMCP = new NotionMCPClient();
export const tavilyMCP = new TavilyMCPClient();
