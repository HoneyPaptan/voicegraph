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

export interface TavilySearchOptions {
  maxResults?: number;
  includeDomains?: string[]; // Prefer results from these domains
  site?: string; // Shortcut to add `site:domain` into the query
}

/**
 * Search the web using Tavily API
 * @param query - Search query
 * @param options - Optional search tuning options
 * @returns Formatted search results as markdown text
 */
export async function searchWeb(
  query: string,
  options: TavilySearchOptions = {}
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

  // Apply site filter directly to query if provided
  const finalQuery = options.site ? `${query} site:${options.site}` : query;

  console.log(`🔍 Tavily Web Search: "${finalQuery}"`, options.includeDomains ? `domains:${options.includeDomains.join(',')}` : '');

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: finalQuery,
        max_results: options.maxResults ?? 5,
        search_depth: 'basic',
        include_answer: true,
        include_raw_content: false,
        include_domains: options.includeDomains,
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
    try {
      console.log('🔎 Tavily meta:', {
        status: response.status,
        ok: response.ok,
        rateLimitRemaining: response.headers.get('x-ratelimit-remaining'),
      });
    } catch (e) {}

    if (!data.results || data.results.length === 0) {
      console.log('⚠️ No search results found for query:', finalQuery);
      return {
        success: true,
        data: `# Search Results for "${finalQuery}"

No results found. Try a different search query.`,
      };
    }

    console.log(`✅ Found ${data.results.length} search results`);

    // Format results as markdown
    let formattedResults = `# Search Results for "${finalQuery}"

`;

    if (data.answer) {
      formattedResults += `## Quick Answer
${data.answer}

`;
    }

    formattedResults += `## Top ${data.results.length} Results

`;

    data.results.forEach((result, index) => {
      formattedResults += `### ${index + 1}. ${result.title}
`;
      formattedResults += `**Source:** ${result.url}
`;
      formattedResults += `**Relevance Score:** ${(result.score * 100).toFixed(1)}%

`;
      formattedResults += `${result.content}

`;
      formattedResults += `---

`;
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
  
  const searchResult = await searchWeb(query, { maxResults: 3 });
  
  if (!searchResult.success) {
    return searchResult;
  }

  return {
    success: true,
    data: `# Web Data: ${topic}

${searchResult.data}`,
  };
}

