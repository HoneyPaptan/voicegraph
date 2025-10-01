# 🚀 Quick Start - Inngest Integration

## What's New?

Your VoiceGraph app now supports **background workflow execution** with complete history tracking!

## Features Added

### ⚡ Background Execution (Inngest)
- Workflows run in the background
- Automatic retries on failure
- Step-based execution for reliability
- No timeout limits

### 📊 Workflow History
- View all past workflow executions
- Click to restore any previous workflow
- Real-time status updates
- Track execution duration and logs

### 🔄 Dual Execution Modes
1. **Real-time** (default): Live SSE streaming
2. **Background** (Inngest): Async execution with history

## Quick Setup (3 Steps)

### Step 1: Start Inngest Dev Server
Open a **NEW terminal** and run:
```bash
npx inngest-cli@latest dev
```

This opens the Inngest dashboard at: http://localhost:8288

### Step 2: Start Your App
In your main terminal:
```bash
cd frontend
npm run dev
```

### Step 3: Use It!
1. Create a workflow (voice or text)
2. Toggle **"Background Execution"** to **ON**
3. Click **"Run in Background"**
4. View progress in **"Workflow History"** (bottom-right)

## How It Works

```
User toggles "Background Execution" ON
    ↓
Click "Run in Background"
    ↓
Workflow sent to Inngest for processing
    ↓
Inngest executes workflow asynchronously
    ↓
History updates in real-time
    ↓
Click any workflow in history to restore state
```

## Testing

### Test Background Execution
1. Create workflow: "Get my Notion meeting notes and email me a summary"
2. Enter Notion ID: `27e6ddfc5f1680228444ed4170ded29e`
3. Toggle "Background Execution" **ON**
4. Click "Run in Background"
5. Check **Workflow History** for updates
6. Open http://localhost:8288 to see Inngest logs

### Test Real-time Execution
1. Create the same workflow
2. Keep "Background Execution" **OFF**
3. Click "Run Workflow"
4. See live updates in Execution Logs

## Monitoring

### Inngest Dashboard (http://localhost:8288)
- View all registered functions
- See execution logs in real-time
- Debug failures
- Replay workflows manually
- Monitor performance

### Workflow History Panel
- Click the button in bottom-right corner
- See all workflows with status badges:
  - ✓ Completed (green)
  - ✗ Failed (red)
  - ⏳ Running (blue)
- Click any workflow to restore its state

## Key Differences

| Feature | Real-time | Background (Inngest) |
|---------|-----------|---------------------|
| UI Blocking | Yes | No |
| Timeout | 30s | None |
| Retries | Manual | Automatic |
| History | Lost on refresh | Persistent |
| Monitoring | Basic logs | Full dashboard |
| Production Ready | Limited | Yes |

## Files Created

- `/lib/inngest/client.ts` - Inngest client setup
- `/lib/inngest/functions.ts` - Workflow execution function
- `/lib/workflow-history.ts` - In-memory history store
- `/app/api/inngest/route.ts` - Inngest webhook endpoint
- `/app/api/execute-inngest/route.ts` - Trigger background execution
- `/app/api/workflow-history/route.ts` - Fetch history
- `/components/WorkflowHistory.tsx` - History UI component

## Troubleshooting

### "Cannot connect to Inngest"
- Ensure dev server is running: `npx inngest-cli@latest dev`
- Check port 8288 is not in use

### "No history showing"
- History is in-memory (resets on server restart)
- For production, integrate a database

### "Function not registered"
- Restart Next.js dev server
- Check `/api/inngest` route is accessible
- Verify Inngest Dev Server shows your function

## Next Steps

- ✅ Test both execution modes
- ✅ Explore Inngest dashboard
- ✅ View and restore workflow history
- 🔜 Deploy to production (see INNGEST_SETUP.md)

## Production Deployment

See `INNGEST_SETUP.md` for full production setup instructions.

Quick version:
1. Sign up at [inngest.com](https://www.inngest.com/)
2. Get your signing key
3. Add `INNGEST_SIGNING_KEY` to env
4. Deploy - Inngest auto-discovers your functions!

---

**Need help?** Check the full docs in `INNGEST_SETUP.md`

