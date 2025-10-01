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

/**
 * Creates a new page in Notion - can be in a database or as a standalone page
 * @param parentId - The parent database ID, page ID, or null for workspace page
 * @param title - Page title
 * @param content - Text content for the page body
 * @param properties - Additional properties for database pages
 * @returns Success message with page URL
 */
export async function createNotionPage(
  parentId: string | null,
  title: string,
  content?: string,
  properties?: Record<string, any>
): Promise<{ success: boolean; data?: string; error?: string; pageUrl?: string }> {
  const notionApiKey = process.env.NOTION_API_KEY;

  if (!notionApiKey) {
    console.error('❌ NOTION_API_KEY not found in environment variables');
    return {
      success: false,
      error: 'Notion API key not configured',
    };
  }

  const notion = new Client({ auth: notionApiKey });
  
  // Determine parent and page structure
  let parent: any;
  let pageProperties: any = {};
  let isDatabase = false;

  if (parentId) {
    const cleanParentId = parentId.trim().replace(/['"]/g, '');
    const formattedParentId = formatNotionId(cleanParentId);
    
    console.log(`📝 Creating Notion page with parent: ${formattedParentId}`);
    console.log(`   Title: "${title}"`);
    
    // Try to determine if it's a database or page by attempting database retrieval
    try {
      await notion.databases.retrieve({ database_id: formattedParentId });
      isDatabase = true;
      parent = { database_id: formattedParentId };
      console.log('🗄️ Parent is a database');
      
      // Build properties for database page
      pageProperties = {
        Name: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      };

      // Add additional properties if provided
      if (properties) {
        Object.entries(properties).forEach(([key, value]) => {
          if (key !== 'Name' && key !== 'title') {
            // Handle different property types
            if (typeof value === 'string') {
              pageProperties[key] = {
                rich_text: [{ text: { content: value } }],
              };
            } else if (typeof value === 'boolean') {
              pageProperties[key] = { checkbox: value };
            } else if (typeof value === 'number') {
              pageProperties[key] = { number: value };
            }
          }
        });
      }
    } catch (dbError) {
      // Not a database, try as a page
      try {
        await notion.pages.retrieve({ page_id: formattedParentId });
        isDatabase = false;
        parent = { page_id: formattedParentId };
        console.log('📄 Parent is a page');
        
        // For page parents, we use title property differently
        pageProperties = {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        };
      } catch (pageError) {
        console.error('❌ Parent ID is neither a valid database nor page');
        return {
          success: false,
          error: `Invalid parent ID: Not a valid database or page ID. Make sure the resource is shared with your integration.`,
        };
      }
    }
  } else {
    // No parent provided - create standalone page (requires a parent page in Notion)
    console.log('📝 Creating standalone Notion page');
    console.log('⚠️ Note: Creating as a child of your workspace root');
    
    // For standalone pages, we need to use the workspace or find a default parent
    // Since Notion API requires a parent, we'll create it with title properties
    // and let the user's workspace handle it
    pageProperties = {
      title: [
        {
          text: {
            content: title,
          },
        },
      ],
    };
    
    // We'll try to create without parent first, then handle the error
    parent = null;
  }

  try {
    let response: any;
    
    if (parent) {
      // Create with specific parent
      const createPayload: any = {
        parent: parent,
        properties: isDatabase ? pageProperties : { title: pageProperties.title },
      };
      
      response = await notion.pages.create(createPayload);
    } else {
      // Try to create standalone page - this will likely fail with Notion API
      // so we'll catch and provide a helpful error message
      try {
        response = await notion.pages.create({
          parent: { workspace: true } as any, // This isn't officially supported
          properties: { title: pageProperties.title },
        });
      } catch (workspaceError) {
        // Try to create a default "Workflow Results" parent page and use it
        console.log('💡 Attempting to create a "Workflow Results" parent page...');
        const parentPageResult = await createWorkflowResultsPage();
        
        if (parentPageResult.success && parentPageResult.pageId) {
          console.log('✅ Created parent page, now creating child page...');
          
          try {
            response = await notion.pages.create({
              parent: { page_id: parentPageResult.pageId },
              properties: { title: pageProperties.title },
            });
          } catch (childError) {
            return {
              success: false,
              error: `Created parent page but failed to create child page: ${childError instanceof Error ? childError.message : 'Unknown error'}`,
            };
          }
        } else {
          return {
            success: false,
            error: `Cannot create standalone page. Notion API requires a parent page or database. 

Possible solutions:
1. Provide a page ID in configuration (any existing Notion page)
2. Provide a database ID in configuration  
3. Create a "Workflow Results" page in Notion manually and use its ID

Attempted auto-creation failed: ${parentPageResult.error || 'Unknown error'}`,
          };
        }
      }
    }

    console.log(`✅ Page created with ID: ${response.id}`);

    // Add content blocks if provided
    if (content && content.trim().length > 0) {
      console.log('📄 Adding content blocks to page...');
      
      // Split content into paragraphs
      const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
      
      const blocks = paragraphs.map((paragraph) => ({
        object: 'block' as const,
        type: 'paragraph' as const,
        paragraph: {
          rich_text: [
            {
              type: 'text' as const,
              text: {
                content: paragraph,
              },
            },
          ],
        },
      }));

      await notion.blocks.children.append({
        block_id: response.id,
        children: blocks,
      });

      console.log(`✅ Added ${blocks.length} content blocks`);
    }

    const pageUrl = response.url || `https://notion.so/${response.id.replace(/-/g, '')}`;
    const parentType = isDatabase ? 'database' : (parentId ? 'page' : 'workspace');
    
    return {
      success: true,
      pageUrl,
      data: `# Notion Page Created Successfully! 🎉\n\n**Title:** ${title}\n**Parent Type:** ${parentType}\n**URL:** ${pageUrl}\n\nYour page has been created and is ready to use!`,
    };
  } catch (error: any) {
    console.error('❌ Notion page creation failed:', error);
    
    let errorMessage = `Failed to create Notion page: ${error.message}`;
    
    if (error.code === 'object_not_found') {
      errorMessage = 'Parent resource not found. Make sure the ID is correct and shared with your integration.';
    } else if (error.code === 'unauthorized') {
      errorMessage = 'Unauthorized. Make sure the parent resource is shared with your Notion integration.';
    } else if (error.code === 'validation_error') {
      errorMessage = `Validation error: ${error.message}. Check that the properties match the expected format.`;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Creates a default "Workflow Results" parent page for the user
 * This can be used as a fallback parent when no specific parent is provided
 * @returns Page ID of the created parent page
 */
export async function createWorkflowResultsPage(): Promise<{ success: boolean; pageId?: string; error?: string }> {
  const notionApiKey = process.env.NOTION_API_KEY;

  if (!notionApiKey) {
    return {
      success: false,
      error: 'Notion API key not configured',
    };
  }

  const notion = new Client({ auth: notionApiKey });

  try {
    console.log('📁 Creating "Workflow Results" parent page...');
    
    // Create a page with basic structure
    const response: any = await notion.pages.create({
      parent: { type: 'workspace', workspace: true } as any,
      properties: {
        title: {
          title: [
            {
              text: {
                content: '🤖 Workflow Results',
              },
            },
          ],
        },
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: 'This page contains results from automated workflows. Each workflow run creates a child page with its results.',
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'divider',
          divider: {},
        },
      ],
    });

    console.log(`✅ Created Workflow Results page with ID: ${response.id}`);
    
    return {
      success: true,
      pageId: response.id,
    };
  } catch (error: any) {
    console.error('❌ Failed to create Workflow Results page:', error);
    return {
      success: false,
      error: `Failed to create parent page: ${error.message}`,
    };
  }
}

/**
 * Appends content to an existing Notion page
 * @param pageId - The page ID to append to
 * @param content - Text content to append
 * @returns Success confirmation
 */
export async function appendToNotionPage(
  pageId: string,
  content: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  const notionApiKey = process.env.NOTION_API_KEY;

  if (!notionApiKey) {
    console.error('❌ NOTION_API_KEY not found in environment variables');
    return {
      success: false,
      error: 'Notion API key not configured',
    };
  }

  const cleanPageId = pageId.trim().replace(/['"]/g, '');
  const formattedPageId = formatNotionId(cleanPageId);

  console.log(`➕ Appending content to Notion page: ${formattedPageId}`);

  const notion = new Client({ auth: notionApiKey });

  try {
    // Split content into paragraphs
    const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
    
    const blocks = paragraphs.map((paragraph) => ({
      object: 'block' as const,
      type: 'paragraph' as const,
      paragraph: {
        rich_text: [
          {
            type: 'text' as const,
            text: {
              content: paragraph,
            },
          },
        ],
      },
    }));

    await notion.blocks.children.append({
      block_id: formattedPageId,
      children: blocks,
    });

    console.log(`✅ Appended ${blocks.length} blocks to page`);

    return {
      success: true,
      data: `Successfully appended ${blocks.length} block(s) to the Notion page.`,
    };
  } catch (error: any) {
    console.error('❌ Failed to append to Notion page:', error);
    
    return {
      success: false,
      error: `Failed to append content: ${error.message}`,
    };
  }
}

