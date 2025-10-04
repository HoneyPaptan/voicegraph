#!/usr/bin/env node

/**
 * Test script to demonstrate markdown to Notion conversion
 */

// Sample markdown content
const sampleMarkdown = `# Project Summary

This is a **bold** statement with *italic* text and \`code\` formatting.

## Key Features

- Feature 1: Important functionality
- Feature 2: Another great feature
- Feature 3: Third feature with **bold text**

## Implementation Steps

1. First step: Setup the environment
2. Second step: Configure the API
3. Third step: Test the integration

## Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Quote

> This is an important quote that should be highlighted.

## Conclusion

The project is **complete** and ready for production!

---

*Last updated: Today*
`;

// Simple markdown to Notion converter (same as in MCP Gateway)
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

// Test the conversion
console.log('🧪 Testing Markdown to Notion Conversion');
console.log('=====================================\n');

console.log('📝 Input Markdown:');
console.log(sampleMarkdown);
console.log('\n' + '='.repeat(50) + '\n');

console.log('🎨 Converted Notion Blocks:');
const blocks = markdownToNotionBlocks(sampleMarkdown);
console.log(JSON.stringify(blocks, null, 2));

console.log('\n📊 Summary:');
console.log(`- Total blocks: ${blocks.length}`);
console.log(`- Headings: ${blocks.filter(b => b.type.startsWith('heading')).length}`);
console.log(`- Lists: ${blocks.filter(b => b.type.includes('list')).length}`);
console.log(`- Code blocks: ${blocks.filter(b => b.type === 'code').length}`);
console.log(`- Quotes: ${blocks.filter(b => b.type === 'quote').length}`);
console.log(`- Dividers: ${blocks.filter(b => b.type === 'divider').length}`);
console.log(`- Paragraphs: ${blocks.filter(b => b.type === 'paragraph').length}`);

console.log('\n✅ Markdown conversion test completed!');
