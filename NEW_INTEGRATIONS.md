# New Integrations Guide 🚀

## Overview
We've added **3 powerful new integrations** to expand VoiceGraph's capabilities:
1. **Tavily API** - Real-time web search
2. **GitHub API** - Repository and issue management
3. **Notion Create** - Bidirectional Notion integration (create/append pages)

---

## 1. Tavily Web Search Integration 🔍

### What It Does
Searches the web for real-time, current information using Tavily's AI-powered search API.

### Node Type
- **Type:** `tavily` or `web_search`
- **Action:** `search_web`
- **Color:** Orange gradient
- **Icon:** 🔍 Search

### Voice Commands Examples
```
"Search the web for latest AI news and email me the results"

"Find current cryptocurrency prices, summarize them, and create a Notion page"

"Search for best React practices, extract key points, and send me an email"
```

### Parameters
```typescript
{
  query: string;          // Search query
  maxResults?: number;    // Max results (default: 5)
}
```

### Output Format
- Markdown-formatted search results
- Includes relevance scores
- Contains title, URL, and content snippets
- Optional "Quick Answer" section

### Example Workflow
```json
{
  "nodes": [
    {
      "id": "step-0",
      "type": "tavily",
      "action": "search_web",
      "params": {
        "query": "latest developments in AI 2025"
      },
      "label": "Search Web"
    },
    {
      "id": "step-1",
      "type": "llm",
      "action": "summarize",
      "label": "Summarize Results"
    },
    {
      "id": "step-2",
      "type": "email",
      "action": "send",
      "label": "Send Email"
    }
  ]
}
```

---

## 2. GitHub Integration 🐙

### What It Does
Interact with GitHub repositories, issues, and code using the GitHub API.

### Node Type
- **Type:** `github`
- **Color:** Dark gray gradient
- **Icon:** 🐙 GitHub

### Actions

#### A. Get Repositories (`get_repos` / `fetch_repos`)
Fetch public repositories for a user or organization.

**Parameters:**
```typescript
{
  username: string;      // GitHub username
  maxRepos?: number;     // Max repos (default: 10)
}
```

**Voice Examples:**
```
"Get my GitHub repositories and email me the list"
"Fetch repositories for username 'torvalds' and summarize them"
```

#### B. Get Issues (`get_issues` / `fetch_issues`)
Fetch issues from a specific repository.

**Parameters:**
```typescript
{
  owner: string;         // Repository owner
  repo: string;          // Repository name
  state?: 'open' | 'closed' | 'all';  // Default: 'open'
  maxIssues?: number;    // Max issues (default: 10)
}
```

**Voice Examples:**
```
"Get open issues from facebook/react and summarize them"
"Find closed issues in my repository and create a Notion page"
```

#### C. Create Issue (`create_issue`)
Create a new issue in a repository.

**Parameters:**
```typescript
{
  owner: string;         // Repository owner
  repo: string;          // Repository name
  title: string;         // Issue title
  body?: string;         // Issue body (can use lastOutput from previous step)
}
```

**Voice Examples:**
```
"Search for React best practices, then create a GitHub issue in my repo with the findings"
"Fetch my Notion notes, summarize them, and create a GitHub issue"
```

### Example Workflow
```json
{
  "nodes": [
    {
      "id": "step-0",
      "type": "github",
      "action": "get_issues",
      "params": {
        "owner": "vercel",
        "repo": "next.js",
        "state": "open"
      },
      "label": "Get Next.js Issues"
    },
    {
      "id": "step-1",
      "type": "llm",
      "action": "analyze",
      "label": "Analyze Issues"
    },
    {
      "id": "step-2",
      "type": "email",
      "action": "send",
      "label": "Send Analysis"
    }
  ]
}
```

---

## 3. Notion Create (Bidirectional) 📝

### What It Does
Create new Notion pages or append content to existing pages - making Notion integration **bidirectional**!

### Node Type
- **Type:** `notion_create`
- **Color:** Blue-indigo gradient
- **Icon:** ✏️ FileEdit

### Actions

#### A. Create Page (`create_page`)
Create a new page in a Notion database.

**Parameters:**
```typescript
{
  databaseId: string;    // Parent database ID (or use config modal)
  title: string;         // Page title
  content?: string;      // Page content (or use lastOutput from previous step)
  properties?: object;   // Additional properties
}
```

**Voice Examples:**
```
"Search for AI news, summarize it, and create a Notion page with the results"
"Get my GitHub issues, analyze them, and save to Notion"
"Fetch my Notion meeting notes, extract action items, and create a new page with them"
```

#### B. Append to Page (`append_to_page`)
Add content to an existing Notion page.

**Parameters:**
```typescript
{
  pageId: string;        // Target page ID (or use config modal)
  content: string;       // Content to append (or use lastOutput)
}
```

**Voice Examples:**
```
"Search for today's news and append it to my Notion daily log"
"Get my emails, summarize them, and add to my Notion page"
```

### Example Workflow (Full Circle!)
```json
{
  "nodes": [
    {
      "id": "step-0",
      "type": "tavily",
      "action": "search_web",
      "params": {
        "query": "latest tech news"
      },
      "label": "Search Web"
    },
    {
      "id": "step-1",
      "type": "llm",
      "action": "summarize",
      "label": "Summarize Results"
    },
    {
      "id": "step-2",
      "type": "notion_create",
      "action": "create_page",
      "params": {
        "title": "Daily Tech News Summary"
      },
      "label": "Save to Notion"
    }
  ]
}
```

---

## Complete Workflow Examples

### Example 1: Research Assistant
**Voice:** "Search for machine learning trends, analyze them, and create a Notion page"

```json
{
  "nodes": [
    {"id": "step-0", "type": "tavily", "action": "search_web"},
    {"id": "step-1", "type": "llm", "action": "analyze"},
    {"id": "step-2", "type": "notion_create", "action": "create_page"}
  ]
}
```

### Example 2: GitHub Issue Tracker
**Voice:** "Get issues from my repo, summarize them, and email me the summary"

```json
{
  "nodes": [
    {"id": "step-0", "type": "github", "action": "get_issues"},
    {"id": "step-1", "type": "llm", "action": "summarize"},
    {"id": "step-2", "type": "email", "action": "send"}
  ]
}
```

### Example 3: Full Pipeline
**Voice:** "Search for React tutorials, summarize them, save to Notion, and create a GitHub issue"

```json
{
  "nodes": [
    {"id": "step-0", "type": "tavily", "action": "search_web"},
    {"id": "step-1", "type": "llm", "action": "summarize"},
    {"id": "step-2", "type": "notion_create", "action": "create_page"},
    {"id": "step-3", "type": "github", "action": "create_issue"}
  ]
}
```

---

## Environment Variables

Make sure these are set in your `.env.local`:

```bash
# Existing
CEREBRAS_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
NOTION_API_KEY=your_key_here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# New
TAVILY_API_KEY= your api key
GITHUB_API_KEY=your api key
```

---

## Error Handling

All new integrations follow the same error handling principles:

1. **API Key Validation**: Check for missing API keys before making requests
2. **Graceful Failures**: Return structured error objects instead of throwing
3. **Detailed Logging**: Console logs for debugging (🔍, 🐙, 📝, ✅, ❌)
4. **User-Friendly Messages**: Clear error messages for common issues
5. **Type Safety**: Full TypeScript support with proper types

---

## Node Icons & Colors

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `notion` | 📊 Database | Blue | Fetch Notion data |
| `notion_create` | ✏️ FileEdit | Blue-Indigo | Create/append Notion |
| `llm` | ✨ Sparkles | Purple | AI processing |
| `email` | 📧 Mail | Green | Send emails |
| `tavily` | 🔍 Search | Orange | Web search |
| `github` | 🐙 GitHub | Dark Gray | GitHub operations |

---

## What's Next?

Suggested improvements:
1. Add more GitHub actions (create PR, comment on issue)
2. Add Tavily advanced search (news, images, videos)
3. Add Slack integration
4. Add Google Calendar integration
5. Add Airtable integration

---

## Testing

To test the new integrations:

1. **Tavily Test:**
   ```
   "Search the web for latest AI news"
   ```

2. **GitHub Test:**
   ```
   "Get repositories for username torvalds"
   ```

3. **Notion Create Test:**
   ```
   "Get my Notion page, summarize it, and create a new page with the summary"
   ```

4. **Full Pipeline Test:**
   ```
   "Search for React best practices, summarize them, save to Notion, and email me"
   ```

---

## Technical Implementation

### File Structure
```
frontend/
├── lib/
│   ├── tools/
│   │   ├── tavily.ts       ← Web search functions
│   │   ├── github.ts       ← GitHub API functions
│   │   ├── notion.ts       ← Extended with create/append
│   │   └── email.ts        ← Existing
│   ├── executor.ts         ← Updated with new node handlers
│   ├── cerebras.ts         ← Updated prompt with new types
│   └── types.ts            ← Updated NodeType enum
└── components/
    └── WorkflowCanvas.tsx  ← New icons and colors
```

### Key Functions

**Tavily (`lib/tools/tavily.ts`):**
- `searchWeb(query, maxResults)` - Main search function
- `extractWebData(query, topic)` - Focused extraction

**GitHub (`lib/tools/github.ts`):**
- `getGitHubRepos(username, maxRepos)` - Fetch repositories
- `getGitHubIssues(owner, repo, state, maxIssues)` - Fetch issues
- `createGitHubIssue(owner, repo, title, body)` - Create issue

**Notion Create (`lib/tools/notion.ts`):**
- `createNotionPage(databaseId, title, content, properties)` - Create page
- `appendToNotionPage(pageId, content)` - Append content

---

## Support

If you encounter issues:
1. Check console logs for detailed error messages
2. Verify API keys are correctly set in `.env.local`
3. Ensure Notion databases/pages are shared with your integration
4. Check GitHub token has appropriate permissions (repo, issues)
5. Verify Tavily API key is active

---

**Built with ❤️ following cursor-rules.json principles:**
- ✅ Simplicity first
- ✅ Full error handling
- ✅ Extensive debugging logs
- ✅ Type safety
- ✅ Real API calls (no mocking)
- ✅ Graceful failures

