import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const mcpGatewayUrl = process.env.MCP_GATEWAY_URL || 'http://mcp-gateway:3001';
    
    // Check if MCP Gateway is running
    const response = await fetch(`${mcpGatewayUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`MCP Gateway health check failed: ${response.status}`);
    }

    const healthData = await response.json();

    return NextResponse.json({
      success: true,
      mcpGateway: {
        status: 'healthy',
        url: mcpGatewayUrl,
        ...healthData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('MCP Health check failed:', error);
    
    return NextResponse.json({
      success: false,
      mcpGateway: {
        status: 'unhealthy',
        error: error.message
      },
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
