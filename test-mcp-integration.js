#!/usr/bin/env node

/**
 * MCP Integration Test Script
 * Tests the MCP Gateway and client integration
 */

const fetch = require('node-fetch');

const MCP_GATEWAY_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

async function testMCPGateway() {
  console.log('🔧 Testing MCP Gateway...');
  
  try {
    const response = await fetch(`${MCP_GATEWAY_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ MCP Gateway is healthy:', data);
      return true;
    } else {
      console.log('❌ MCP Gateway health check failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ MCP Gateway is unreachable:', error.message);
    return false;
  }
}

async function testMCPNotion() {
  console.log('📄 Testing Notion MCP Server...');
  
  try {
    const response = await fetch(`${MCP_GATEWAY_URL}/mcp/notion/info`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Notion MCP Server is available:', data);
      return true;
    } else {
      console.log('❌ Notion MCP Server failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Notion MCP Server is unreachable:', error.message);
    return false;
  }
}

async function testMCPTavily() {
  console.log('🔍 Testing Tavily MCP Server...');
  
  try {
    const response = await fetch(`${MCP_GATEWAY_URL}/mcp/tavily/info`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Tavily MCP Server is available:', data);
      return true;
    } else {
      console.log('❌ Tavily MCP Server failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Tavily MCP Server is unreachable:', error.message);
    return false;
  }
}

async function testFrontendHealth() {
  console.log('🌐 Testing Frontend Health...');
  
  try {
    const response = await fetch(`${FRONTEND_URL}/api/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Frontend is healthy:', data);
      return true;
    } else {
      console.log('❌ Frontend health check failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend is unreachable:', error.message);
    return false;
  }
}

async function testMCPHealth() {
  console.log('🔧 Testing MCP Health Endpoint...');
  
  try {
    const response = await fetch(`${FRONTEND_URL}/api/mcp-health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ MCP Health endpoint is working:', data);
      return true;
    } else {
      console.log('❌ MCP Health endpoint failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ MCP Health endpoint is unreachable:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting MCP Integration Tests...\n');
  
  const results = {
    mcpGateway: await testMCPGateway(),
    mcpNotion: await testMCPNotion(),
    mcpTavily: await testMCPTavily(),
    frontend: await testFrontendHealth(),
    mcpHealth: await testMCPHealth()
  };
  
  console.log('\n📊 Test Results:');
  console.log('================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${test.padEnd(15)}: ${status}`);
  });
  
  const allPassed = Object.values(results).every(Boolean);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! MCP integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure all services are running: docker-compose ps');
    console.log('   2. Check service logs: docker-compose logs -f');
    console.log('   3. Verify environment variables are set correctly');
    console.log('   4. Restart services: docker-compose restart');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testMCPGateway,
  testMCPNotion,
  testMCPTavily,
  testFrontendHealth,
  testMCPHealth,
  runTests
};
