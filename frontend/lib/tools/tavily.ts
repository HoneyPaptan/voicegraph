/**
 * Tavily Web Search Integration
 * Provides real-time web search capabilities for gathering current data
 */

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilySearchResult[];
  query: string;
  answer?: string;
}

/**
 * Search the web using Tavily API
 * @param query - Search query
 * @param maxResults - Maximum number of results to return (default: 5)
 * @returns Formatted search results as markdown text
 */
export async function searchWeb(
  query: string,
  maxResults: number = 5
): Promise<{ success: boolean; data?: string; error?: string }> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.error('❌ TAVILY_API_KEY not found in environment variables');
    return {
      success: false,
      error: 'Tavily API key not configured. Please add TAVILY_API_KEY to .env.local',
    };
  }

  if (!query || query.trim().length === 0) {
    return {
      success: false,
      error: 'Search query cannot be empty',
    };
  }

  console.log(`🔍 Tavily Web Search: "${query}"`);

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        max_results: maxResults,
        search_depth: 'basic',
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Tavily API error:', response.status, errorText);
      return {
        success: false,
        error: `Tavily API returned ${response.status}: ${errorText}`,
      };
    }

    const data: TavilyResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      console.log('⚠️ No search results found for query:', query);
      return {
        success: true,
        data: `# Search Results for "${query}"\n\nNo results found. Try a different search query.`,
      };
    }

    console.log(`✅ Found ${data.results.length} search results`);

    // Format results as markdown
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
      data: formattedResults,
    };
  } catch (error: any) {
    console.error('❌ Tavily search failed:', error);
    return {
      success: false,
      error: `Failed to search web: ${error.message}`,
    };
  }
}

/**
 * Extract specific information from web search results using focused query
 */
export async function extractWebData(
  query: string,
  topic: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  console.log(`🎯 Extracting web data about "${topic}" using query: "${query}"`);
  
  const searchResult = await searchWeb(query, 3);
  
  if (!searchResult.success) {
    return searchResult;
  }

  return {
    success: true,
    data: `# Web Data: ${topic}\n\n${searchResult.data}`,
  };
}

