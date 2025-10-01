import { Client } from '@notionhq/client';

/**
 * Smart Notion fetcher - automatically detects if ID is a page or database
 * @param id - The Notion page or database ID
 * @returns Content as formatted text
 */
export async function fetchNotion(id: string): Promise<string> {
  const notionApiKey = process.env.NOTION_API_KEY;
  
  if (!notionApiKey) {
    throw new Error('NOTION_API_KEY not configured');
  }

  // Clean and format ID
  const cleanId = id.trim().replace(/['"]/g, '');
  const formattedId = formatNotionId(cleanId);

  console.log('🔍 Fetching Notion resource:', formattedId);

  const notion = new Client({ auth: notionApiKey });

  try {
    // Try as page first
    const page = await notion.pages.retrieve({ page_id: formattedId });
    console.log('✓ Detected as Notion PAGE');
    return await fetchNotionPageContent(notion, formattedId, page);
  } catch (pageError: any) {
    console.log('❌ Not a page, trying as database...');
    
    try {
      // Try as database
      const response: any = await (notion.databases as any).query({
        database_id: formattedId,
        page_size: 50,
      });
      console.log('✓ Detected as Notion DATABASE');
      return formatDatabaseContent(response);
    } catch (dbError: any) {
      console.error('Failed as both page and database:', { pageError, dbError });
      throw new Error(`Could not fetch Notion resource. Make sure: 1) The ID is correct, 2) The resource is shared with your integration. ID: ${formattedId}`);
    }
  }
}

/**
 * Formats a Notion ID to dashed UUID format
 */
function formatNotionId(id: string): string {
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id.replace(/-/g, ''))) {
    throw new Error(`Invalid Notion ID format. Expected a UUID, but got: ${id}`);
  }

  // Add dashes if not present
  if (!id.includes('-') && id.length === 32) {
    return id.slice(0, 8) + '-' +
           id.slice(8, 12) + '-' +
           id.slice(12, 16) + '-' +
           id.slice(16, 20) + '-' +
           id.slice(20);
  }
  return id;
}

/**
 * Fetches and formats Notion page content
 */
async function fetchNotionPageContent(notion: Client, pageId: string, page: any): Promise<string> {
  // Fetch blocks (content)
  const blocks = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 100,
  });

  let content = '';
  
  // Add page title if available
  if ('properties' in page) {
    const titleProp: any = Object.values(page.properties).find(
      (prop: any) => prop.type === 'title'
    );
    if (titleProp && titleProp.title && titleProp.title.length > 0) {
      content += `# ${titleProp.title[0].plain_text}\n\n`;
    }
  }

  // Extract block content
  for (const block of blocks.results) {
    if ('type' in block) {
      const blockType = block.type;
      const blockContent = (block as any)[blockType];
      
      if (blockContent && blockContent.rich_text) {
        const text = blockContent.rich_text
          .map((rt: any) => rt.plain_text)
          .join('');
        content += text + '\n';
      }
    }
  }

  return content.trim() || 'Empty page';
}

/**
 * Formats database query response
 */
function formatDatabaseContent(response: any): string {
  let content = 'Database Entries:\n\n';

  for (const page of response.results) {
    if ('properties' in page) {
      const properties = page.properties;
      
      // Extract title/name
      const titleProp: any = Object.values(properties).find(
        (prop: any) => prop.type === 'title'
      );
      
      if (titleProp && titleProp.title && titleProp.title.length > 0) {
        content += `- ${titleProp.title[0].plain_text}\n`;
      }
      
      // Extract other properties
      for (const [key, value] of Object.entries(properties)) {
        const prop = value as any;
        if (prop.type === 'rich_text' && prop.rich_text.length > 0) {
          content += `  ${key}: ${prop.rich_text[0].plain_text}\n`;
        } else if (prop.type === 'select' && prop.select) {
          content += `  ${key}: ${prop.select.name}\n`;
        } else if (prop.type === 'date' && prop.date) {
          content += `  ${key}: ${prop.date.start}\n`;
        } else if (prop.type === 'checkbox') {
          content += `  ${key}: ${prop.checkbox ? '✓' : '☐'}\n`;
        } else if (prop.type === 'number' && prop.number !== null) {
          content += `  ${key}: ${prop.number}\n`;
        }
      }
      content += '\n';
    }
  }

  return content.trim() || 'Empty database';
}

/**
 * Fetches a Notion page by ID (legacy - kept for compatibility)
 * @param pageId - The Notion page ID
 * @returns Page content as markdown-like text
 */
export async function fetchNotionPage(pageId: string): Promise<string> {
  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    
    if (!notionApiKey) {
      throw new Error('NOTION_API_KEY not configured');
    }

    // Clean and validate page ID
    const cleanPageId = pageId.trim().replace(/['"]/g, '');
    
    // Validate UUID format (with or without dashes)
    const uuidRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleanPageId.replace(/-/g, ''))) {
      throw new Error(`Invalid Notion page ID format. Expected a UUID (e.g., 1234567890abcdef1234567890abcdef), but got: ${cleanPageId}`);
    }

    // Add dashes if not present (Notion API prefers dashed format)
    let formattedPageId = cleanPageId;
    if (!cleanPageId.includes('-') && cleanPageId.length === 32) {
      formattedPageId = 
        cleanPageId.slice(0, 8) + '-' +
        cleanPageId.slice(8, 12) + '-' +
        cleanPageId.slice(12, 16) + '-' +
        cleanPageId.slice(16, 20) + '-' +
        cleanPageId.slice(20);
    }

    console.log('Fetching Notion page:', formattedPageId);

    const notion = new Client({ auth: notionApiKey });
    
    // Fetch page content
    const page = await notion.pages.retrieve({ page_id: formattedPageId });
    
    // Fetch blocks (content)
    const blocks = await notion.blocks.children.list({
      block_id: formattedPageId,
      page_size: 100,
    });

    // Extract text from blocks
    let content = '';
    
    // Add page title if available
    if ('properties' in page) {
      const titleProp: any = Object.values(page.properties).find(
        (prop: any) => prop.type === 'title'
      );
      if (titleProp && titleProp.title && titleProp.title.length > 0) {
        content += `# ${titleProp.title[0].plain_text}\n\n`;
      }
    }

    // Extract block content
    for (const block of blocks.results) {
      if ('type' in block) {
        const blockType = block.type;
        const blockContent = (block as any)[blockType];
        
        if (blockContent && blockContent.rich_text) {
          const text = blockContent.rich_text
            .map((rt: any) => rt.plain_text)
            .join('');
          content += text + '\n';
        }
      }
    }

    return content.trim() || 'Empty page';
  } catch (error: any) {
    console.error('Notion fetch error:', error);
    throw new Error(`Failed to fetch Notion page: ${error.message}`);
  }
}

/**
 * Fetches a Notion database and returns entries
 * @param databaseId - The Notion database ID
 * @returns Database entries as formatted text
 */
export async function fetchNotionDatabase(databaseId: string): Promise<string> {
  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    
    if (!notionApiKey) {
      throw new Error('NOTION_API_KEY not configured');
    }

    // Clean and validate database ID
    const cleanDatabaseId = databaseId.trim().replace(/['"]/g, '');
    
    // Validate UUID format (with or without dashes)
    const uuidRegex = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cleanDatabaseId.replace(/-/g, ''))) {
      throw new Error(`Invalid Notion database ID format. Expected a UUID (e.g., 1234567890abcdef1234567890abcdef), but got: ${cleanDatabaseId}`);
    }

    // Add dashes if not present (Notion API requires dashed format for databases)
    let formattedDatabaseId = cleanDatabaseId;
    if (!cleanDatabaseId.includes('-') && cleanDatabaseId.length === 32) {
      formattedDatabaseId = 
        cleanDatabaseId.slice(0, 8) + '-' +
        cleanDatabaseId.slice(8, 12) + '-' +
        cleanDatabaseId.slice(12, 16) + '-' +
        cleanDatabaseId.slice(16, 20) + '-' +
        cleanDatabaseId.slice(20);
    }

    console.log('Querying Notion database:', formattedDatabaseId);

    const notion = new Client({ auth: notionApiKey });
    
    // Query the database
    const response: any = await (notion.databases as any).query({
      database_id: formattedDatabaseId,
      page_size: 50,
    });

    console.log(`✓ Database query successful, found ${response.results.length} pages`);

    let content = 'Database Entries:\n\n';

    for (const page of response.results) {
      if ('properties' in page) {
        const properties = page.properties;
        
        // Extract title/name
        const titleProp: any = Object.values(properties).find(
          (prop: any) => prop.type === 'title'
        );
        
        if (titleProp && titleProp.title && titleProp.title.length > 0) {
          content += `- ${titleProp.title[0].plain_text}\n`;
        }
        
        // Extract other properties
        for (const [key, value] of Object.entries(properties)) {
          const prop = value as any;
          if (prop.type === 'rich_text' && prop.rich_text.length > 0) {
            content += `  ${key}: ${prop.rich_text[0].plain_text}\n`;
          } else if (prop.type === 'select' && prop.select) {
            content += `  ${key}: ${prop.select.name}\n`;
          } else if (prop.type === 'date' && prop.date) {
            content += `  ${key}: ${prop.date.start}\n`;
          } else if (prop.type === 'checkbox') {
            content += `  ${key}: ${prop.checkbox ? '✓' : '☐'}\n`;
          } else if (prop.type === 'number' && prop.number !== null) {
            content += `  ${key}: ${prop.number}\n`;
          }
        }
        content += '\n';
      }
    }

    return content.trim() || 'Empty database';
  } catch (error: any) {
    console.error('Notion database fetch error:', error);
    
    // Provide helpful error messages
    if (error.code === 'object_not_found') {
      throw new Error('Notion database not found. Make sure the database ID is correct and shared with your integration.');
    } else if (error.code === 'unauthorized') {
      throw new Error('Unauthorized to access Notion database. Share the database with your integration.');
    } else if (error.code === 'validation_error') {
      throw new Error(`Invalid database ID format: ${error.message}`);
    }
    
    throw new Error(`Failed to fetch Notion database: ${error.message}`);
  }
}

