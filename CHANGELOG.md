# Changelog - AI Workflow Orchestrator

## Latest Updates

### ✅ Fixed: Sequential Edge Connections (2025-09-30)

**Problem:** Workflow nodes were not visually connected with edges.

**Root Cause:** Custom React Flow nodes were missing `<Handle>` components, which are required connection points for edges.

**Solution:**
- Added `Handle` import from `reactflow`
- Added `target` handle (top) for incoming edges
- Added `source` handle (bottom) for outgoing edges
- Edges now render as purple, animated, curved lines with arrows

**Files Changed:**
- `frontend/components/WorkflowCanvas.tsx`

---

### ✅ Fixed: Smart LLM Content Routing (2025-09-30)

**Problem:** When adding custom extraction nodes (like "extract next meeting date"), they received summarized content instead of original data, causing incorrect results.

**Example Issue:**
```
Node 1 (Notion) → Full meeting notes
Node 2 (LLM Summarize) → Summary (loses date details)
Node 3 (LLM Extract Date) → Gets summary ❌ Can't find date!
```

**Solution:** 
- Store original Notion content as `context.sourceContent`
- Intelligently route content based on LLM action type:
  - **Extraction tasks** (extract, find, get) → Use SOURCE content ✅
  - **Analysis tasks** (analyze, insights) → Use SOURCE content ✅
  - **Transformation tasks** (summarize) → Use PREVIOUS output ✅
- Enhanced prompts with specific instructions for each action type

**Benefits:**
- Extraction nodes now access original data
- Multiple LLM nodes can coexist without information loss
- Any custom action is automatically handled correctly

**Files Changed:**
- `frontend/lib/executor.ts` (smart content routing)
- `frontend/app/api/execute/route.ts` (store sourceContent)
- `frontend/lib/types.ts` (updated ExecutionContext type)

---

## Previous Features

### Voice-Powered Workflow Editing
- Edit workflows after creation using natural language
- Add, remove, or modify nodes with voice commands
- Dynamic LLM action generation

### Automatic Edge Generation
- Sequential workflow connections created automatically
- Adapts when nodes are added/removed via editing

### Visual Enhancements
- Animated node generation with Framer Motion
- Custom node styling with gradient backgrounds
- Status indicators (active, completed, error)
- Real-time execution highlighting

### Core Functionality
- Speech-to-text with Groq Whisper
- Workflow parsing with Cerebras (Llama models)
- Notion API integration (pages & databases)
- Email delivery with Gmail SMTP
- Server-sent events for real-time logs
- Docker containerization

---

## Known Issues

None currently reported.

---

## Upcoming Features

- [ ] Parallel workflow branches
- [ ] Workflow templates library
- [ ] Node configuration persistence
- [ ] Retry failed nodes
- [ ] Export workflow as JSON
- [ ] Workflow history/versioning

