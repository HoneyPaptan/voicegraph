/**
 * Markdown to Notion Rich Text Converter
 * Converts markdown content to Notion's rich text format for beautiful page creation
 */

export interface NotionRichText {
  type: 'text' | 'mention' | 'equation';
  text?: {
    content: string;
    link?: { url: string };
  };
  mention?: {
    type: 'user' | 'page' | 'database' | 'date' | 'link_preview';
    [key: string]: any;
  };
  equation?: {
    expression: string;
  };
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: 'default' | 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red' | 'gray_background' | 'brown_background' | 'orange_background' | 'yellow_background' | 'green_background' | 'blue_background' | 'purple_background' | 'pink_background' | 'red_background';
  };
}

export interface NotionBlock {
  object: 'block';
  type: 'paragraph' | 'heading_1' | 'heading_2' | 'heading_3' | 'bulleted_list_item' | 'numbered_list_item' | 'code' | 'quote' | 'divider' | 'table_of_contents';
  [key: string]: any;
}

/**
 * Converts markdown text to Notion rich text format
 */
export function markdownToNotionRichText(text: string): NotionRichText[] {
  const richTexts: NotionRichText[] = [];
  let currentText = text;
  let index = 0;

  // Process bold and italic (order matters - bold first)
  const boldRegex = /\*\*(.*?)\*\*/g;
  const italicRegex = /\*(.*?)\*/g;
  const codeRegex = /`(.*?)`/g;
  const strikethroughRegex = /~~(.*?)~~/g;
  const underlineRegex = /__(.*?)__/g;

  // Find all formatting matches
  const matches: Array<{
    start: number;
    end: number;
    type: 'bold' | 'italic' | 'code' | 'strikethrough' | 'underline';
    content: string;
  }> = [];

  let match;
  
  // Bold
  while ((match = boldRegex.exec(currentText)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'bold',
      content: match[1]
    });
  }

  // Italic
  while ((match = italicRegex.exec(currentText)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'italic',
      content: match[1]
    });
  }

  // Code
  while ((match = codeRegex.exec(currentText)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'code',
      content: match[1]
    });
  }

  // Strikethrough
  while ((match = strikethroughRegex.exec(currentText)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'strikethrough',
      content: match[1]
    });
  }

  // Underline
  while ((match = underlineRegex.exec(currentText)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'underline',
      content: match[1]
    });
  }

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Process text with formatting
  let lastEnd = 0;
  
  for (const match of matches) {
    // Add plain text before this match
    if (match.start > lastEnd) {
      const plainText = currentText.slice(lastEnd, match.start);
      if (plainText) {
        richTexts.push({
          type: 'text',
          text: { content: plainText }
        });
      }
    }

    // Add formatted text
    const annotations: NotionRichText['annotations'] = {};
    if (match.type === 'bold') annotations.bold = true;
    if (match.type === 'italic') annotations.italic = true;
    if (match.type === 'code') annotations.code = true;
    if (match.type === 'strikethrough') annotations.strikethrough = true;
    if (match.type === 'underline') annotations.underline = true;

    richTexts.push({
      type: 'text',
      text: { content: match.content },
      annotations: Object.keys(annotations).length > 0 ? annotations : undefined
    });

    lastEnd = match.end;
  }

  // Add remaining plain text
  if (lastEnd < currentText.length) {
    const plainText = currentText.slice(lastEnd);
    if (plainText) {
      richTexts.push({
        type: 'text',
        text: { content: plainText }
      });
    }
  }

  return richTexts.length > 0 ? richTexts : [{ type: 'text', text: { content: text } }];
}

/**
 * Converts markdown content to Notion blocks
 */
export function markdownToNotionBlocks(content: string): NotionBlock[] {
  const lines = content.split('\n');
  const blocks: NotionBlock[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let inList = false;
  let listItems: string[] = [];
  let inNumberedList = false;
  let numberedItems: string[] = [];

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
          rich_text: markdownToNotionRichText(trimmedLine.slice(4))
        }
      });
    } else if (trimmedLine.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: markdownToNotionRichText(trimmedLine.slice(3))
        }
      });
    } else if (trimmedLine.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: markdownToNotionRichText(trimmedLine.slice(2))
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
          rich_text: markdownToNotionRichText(trimmedLine.slice(2))
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
              rich_text: markdownToNotionRichText(item)
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
              rich_text: markdownToNotionRichText(item)
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
          rich_text: markdownToNotionRichText(trimmedLine)
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
              rich_text: markdownToNotionRichText(item)
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
              rich_text: markdownToNotionRichText(item)
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
          rich_text: markdownToNotionRichText(item)
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
          rich_text: markdownToNotionRichText(item)
        }
      });
    }
  }

  return blocks;
}

/**
 * Processes markdown content and converts links to Notion format
 */
export function processMarkdownLinks(content: string): string {
  // Convert markdown links to plain text with URL
  return content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
}
