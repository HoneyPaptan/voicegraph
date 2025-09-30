# 📝 Notion Integration Setup Guide

## Getting Your Notion Page ID

The Notion page ID is a 32-character UUID that you need to extract from your page URL.

### Step 1: Open Your Notion Page

Open the Notion page you want to use in your browser.

### Step 2: Copy the Page URL

The URL will look like one of these formats:

```
Format 1: https://www.notion.so/PageName-1234567890abcdef1234567890abcdef
Format 2: https://www.notion.so/workspace/1234567890abcdef1234567890abcdef?v=...
Format 3: https://www.notion.so/1234567890abcdef1234567890abcdef
```

### Step 3: Extract the Page ID

The page ID is the **32-character hexadecimal string** (without dashes) at the end of the URL.

**Examples:**

1. From: `notion.so/My-Meeting-Notes-1a2b3c4d5e6f7890a1b2c3d4e5f67890`
   - Page ID: `1a2b3c4d5e6f7890a1b2c3d4e5f67890`

2. From: `notion.so/abcdef1234567890abcdef1234567890?v=123`
   - Page ID: `abcdef1234567890abcdef1234567890`

3. With dashes (convert): `notion.so/PageName-12345678-1234-1234-1234-1234567890ab`
   - Remove dashes: `123456781234123412341234567890ab`

### Step 4: Use in the App

When the config modal opens, paste **only the 32-character UUID** without dashes:

✅ **Correct:** `1a2b3c4d5e6f7890a1b2c3d4e5f67890`

❌ **Wrong:** 
- `"your-journal-page-id"` (placeholder text)
- `1a2b3c4d-5e6f-7890-a1b2-c3d4e5f67890` (with dashes)
- `notion.so/PageName-1a2b3c4d...` (full URL)

## Setting Up Notion Integration

### 1. Create Integration

1. Go to https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Give it a name (e.g., "Workflow Orchestrator")
4. Select your workspace
5. Click **"Submit"**
6. Copy the **"Internal Integration Token"** (starts with `secret_`)

### 2. Share Pages with Integration

For each page you want to access:

1. Open the page in Notion
2. Click the **"..."** menu (top right)
3. Scroll down to **"Add connections"**
4. Search for your integration name
5. Click to connect

⚠️ **Important:** If you don't share the page with your integration, you'll get a "page not found" error!

### 3. Add to Environment Variables

Add to your `frontend/.env.local`:

```env
NOTION_API_KEY=secret_your_integration_token_here
```

## Getting Database IDs

For Notion databases, the process is similar:

1. Open the database (full page or inline)
2. Click **"..."** → **"Copy link to view"**
3. URL format: `notion.so/DatabaseName-abc123...?v=def456...`
4. Extract the first 32-character ID (before the `?v=`)
5. Remove any dashes

Example:
- URL: `notion.so/Tasks-a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4?v=123`
- Database ID: `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4`

## Troubleshooting

### Error: "Invalid Notion page ID format"

✅ **Solution:** Make sure the ID is:
- Exactly 32 characters long (without dashes)
- Only contains hexadecimal characters (0-9, a-f)
- No quotes, no spaces, no special characters

### Error: "Page not found" or "Unauthorized"

✅ **Solutions:**
1. Make sure you've shared the page with your integration
2. Verify your `NOTION_API_KEY` is correct
3. Check the integration has access to the workspace

### Error: "path failed validation"

✅ **Solution:** You're using placeholder text. Use a real Notion page ID.

## Quick Test

To verify your setup works:

```bash
# Check if your API key is set
echo $NOTION_API_KEY

# Test with curl (replace with your page ID and token)
curl https://api.notion.com/v1/pages/YOUR_PAGE_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Notion-Version: 2022-06-28"
```

If you see page data returned, your setup is correct! ✅

## Common Page ID Examples

Here are real (sanitized) examples of valid page IDs:

```
1234567890abcdef1234567890abcdef  ✅
abcdef1234567890abcdef1234567890  ✅
a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4  ✅
```

Invalid examples:

```
"your-journal-page-id"             ❌ (placeholder)
my-page-name                       ❌ (not a UUID)
1234-5678-90ab-cdef                ❌ (too short, has dashes)
notion.so/abc123...                ❌ (full URL)
```

---

**Need Help?** Check the Notion API documentation: https://developers.notion.com/

