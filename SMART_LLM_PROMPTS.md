# Smart LLM Prompt Generation

## Overview

The system now intelligently determines which content to use for LLM tasks and generates highly specific prompts to ensure accurate results.

## How It Works

### Content Selection Strategy

The executor automatically decides which content to use based on the LLM action:

1. **Extraction Tasks** (extract, find, get)
   - Uses **original source content** from Notion
   - Example: "extract_next_meeting_date" reads the original meeting notes

2. **Analysis Tasks** (analyze, insights)
   - Uses **original source content** from Notion
   - Example: "analyze" reads the original document

3. **Transformation Tasks** (summarize, rewrite)
   - Uses **previous step output**
   - Example: "summarize" reads the previous LLM output (if chained)

### Prompt Generation

#### Predefined Actions

- **summarize**: "Create a concise, well-structured summary of the following content. Include key points, action items, and important dates."
- **analyze**: "Analyze the following content and provide key insights, trends, and recommendations."
- **extract_insights**: "Extract the most important insights, learnings, and takeaways from the following content."

#### Custom Actions (Dynamic)

Any custom action is automatically converted to a clear prompt:

- `extract_next_meeting_date` → "Extract the next meeting date from the following content. Be specific and provide ONLY the requested information. If the information is not found, clearly state 'Not found in the content'."
- `find_action_items` → "Find action items from the following content..."
- `get_key_decisions` → "Get key decisions from the following content..."

## Example Workflow

```
1. Fetch Notion Meeting Notes (Notion)
   ↓ Output: Full meeting notes text
   ↓ Context.sourceContent = Full notes

2. Summarize Meeting Notes (LLM)
   ↓ Input: Full notes (lastOutput)
   ↓ Output: Concise summary
   ↓ Context.lastOutput = Summary

3. Extract Next Meeting Date (LLM)
   ↓ Input: Full notes (sourceContent) ← Smart!
   ↓ Output: "Next meeting: 21st December 2025"
   ↓ Context.lastOutput = Date

4. Email Summary (Email)
   ↓ Input: Date (lastOutput from step 3)
   ↓ Sends email with the extracted date
```

## Benefits

1. **Accurate Extractions**: Extraction tasks always read the original data, not summaries
2. **Flexible Workflows**: You can add any custom action in voice editing
3. **Clear Results**: Specific prompts ensure LLM provides exactly what you need
4. **No Information Loss**: Summarization doesn't hide data needed for extraction

## Creating Custom Actions

When editing workflows with voice, use clear action names:

### Good Examples
- "extract the meeting date" → `extract_meeting_date`
- "find all action items" → `find_action_items`
- "get the list of attendees" → `get_list_of_attendees`
- "analyze the sentiment" → `analyze_sentiment`

### System Behavior
- Words with "extract", "find", "get" → Uses original source
- Words with "analyze", "insights" → Uses original source
- Other actions → Uses previous step output

## Technical Details

### Context Structure
```typescript
{
  sourceContent: string,  // Original Notion content
  lastOutput: string,     // Previous node output
  notionPageId: string,   // User config
  recipientEmail: string, // User config
  // ... other fields
}
```

### Execution Flow
```typescript
if (action.includes('extract') || action.includes('find') || action.includes('get')) {
  inputContent = context.sourceContent || context.lastOutput;
} else {
  inputContent = context.lastOutput;
}
```

## Debugging

Check the console logs during execution:
- `🤖 LLM Node Action:` - The action being executed
- `📝 Using: SOURCE/PREVIOUS content` - Which content is being used
- `💬 Prompt:` - The actual prompt sent to Cerebras

This helps you understand exactly what the LLM is processing.

