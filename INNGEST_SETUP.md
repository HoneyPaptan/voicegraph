# Inngest Background Workflow Execution

## Overview

VoiceGraph now supports **background workflow execution** using [Inngest](https://www.inngest.com/). This allows workflows to run asynchronously with automatic retries, and provides a complete history of all executions.

## Features

### 🚀 Background Execution
- Workflows run in the background without blocking the UI
- Automatic retries on failure (built into Inngest)
- Step-based execution for reliability

### 📊 Workflow History
- View all past workflow executions
- Click to restore any previous workflow state
- Real-time status updates (pending, running, completed, failed)
- Track execution duration and logs

### ⚡ Execution Modes
1. **Real-time Mode** (default): Traditional SSE streaming with live updates
2. **Background Mode**: Inngest-powered async execution with history tracking

## Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install inngest
```

### 2. Start Inngest Dev Server
In a **separate terminal**, run:
```bash
npx inngest-cli@latest dev
```

This starts the Inngest Dev Server at `http://localhost:8288` where you can:
- Monitor function executions
- View logs and errors
- Replay failed runs
- Test workflows

### 3. Run Your Application
```bash
npm run dev
```

Your Next.js app will connect to the Inngest Dev Server automatically.

## How to Use

### Toggle Background Execution
1. Create a workflow using voice or examples
2. Look for the **"Background Execution"** toggle in the workflow action panel
3. Click to enable **ON**
4. Click **"Run in Background"**

The workflow will:
- Start immediately in the background
- Show a workflow ID for tracking
- Prompt you to check "Workflow History"

### View Workflow History
1. Click the **"Workflow History"** button (bottom-right corner)
2. See all past executions with:
   - Status badges (completed ✓, failed ✗, running ⏳)
   - Original voice command
   - Execution duration
   - Timestamp
3. Click any workflow to restore its state

### Monitor in Inngest Dashboard
Open `http://localhost:8288` to:
- See all functions registered
- View execution logs in real-time
- Debug failures
- Replay workflows

## Architecture

### Components

#### 1. Inngest Client (`lib/inngest/client.ts`)
- Initializes Inngest client
- Configured with app ID

#### 2. Inngest Functions (`lib/inngest/functions.ts`)
- `executeWorkflowFunction`: Main workflow executor
- Uses steps for reliability and automatic retries
- Handles parallel execution
- Updates workflow history

#### 3. Workflow History Store (`lib/workflow-history.ts`)
- In-memory storage of workflow runs
- Tracks status, logs, config
- Thread-safe operations

#### 4. API Routes
- `/api/inngest`: Inngest webhook endpoint (required)
- `/api/execute-inngest`: Triggers background execution
- `/api/workflow-history`: Fetches execution history

#### 5. UI Components
- `WorkflowHistory`: Displays history with restore functionality
- Execution mode toggle in main page

### Data Flow

```
User clicks "Run in Background"
    ↓
/api/execute-inngest creates workflow run
    ↓
Sends event to Inngest: "workflow/execute.requested"
    ↓
Inngest function starts (automatic retries enabled)
    ↓
Executes nodes layer by layer (parallel support)
    ↓
Updates workflow history with logs
    ↓
User sees history in "Workflow History" panel
```

## Production Deployment

### 1. Sign up for Inngest Cloud
Visit [inngest.com](https://www.inngest.com/) and create an account.

### 2. Get Your Keys
```bash
INNGEST_SIGNING_KEY=signkey-prod-...
INNGEST_EVENT_KEY=eventkey-prod-...
```

### 3. Set Environment Variables
Add to your production `.env`:
```env
INNGEST_SIGNING_KEY=your_signing_key
INNGEST_EVENT_KEY=your_event_key
```

### 4. Deploy
Inngest automatically discovers functions at:
```
https://your-domain.com/api/inngest
```

No separate deployment needed - your Next.js app handles everything!

## Benefits

### vs Real-time Execution

| Feature | Real-time | Background (Inngest) |
|---------|-----------|---------------------|
| UI Blocking | Yes (waits for completion) | No (runs async) |
| Retries | Manual | Automatic |
| History | Lost on refresh | Persistent |
| Scalability | Limited | Serverless |
| Monitoring | Basic logs | Full dashboard |
| Long workflows | Times out | No timeout |

### Use Cases

**Use Real-time when:**
- Quick feedback needed
- Short workflows (<30s)
- Development/testing

**Use Background when:**
- Long-running workflows
- Production deployments
- Need reliability/retries
- Want execution history

## Troubleshooting

### "Cannot connect to Inngest"
- Ensure dev server is running: `npx inngest-cli@latest dev`
- Check port 8288 is not in use

### "No history showing"
- Workflow history is in-memory (resets on restart)
- For production, integrate a database

### "Function not registered"
- Restart Next.js dev server
- Check `/api/inngest` route is accessible
- Verify Inngest Dev Server shows your function

## Future Enhancements

- [ ] Database persistence for history
- [ ] User authentication and per-user history
- [ ] Scheduled/cron workflows
- [ ] Email notifications on completion
- [ ] Export workflow history to CSV

## Resources

- [Inngest Documentation](https://www.inngest.com/docs)
- [Next.js Quick Start](https://www.inngest.com/docs/getting-started/nextjs-quick-start)
- [Inngest Functions](https://www.inngest.com/docs/learn/inngest-functions)
- [Steps & Workflows](https://www.inngest.com/docs/features/inngest-functions/steps-workflows)

