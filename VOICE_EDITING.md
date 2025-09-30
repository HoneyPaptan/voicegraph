# 🎙️ Voice Editing Feature Guide

## 🚀 New Features

### 1. **Voice-Powered Workflow Editing**
Edit your workflows using natural language voice commands - no manual coding required!

### 2. **Beautiful Visual Connections**
Gorgeous gradient-animated edges connecting your workflow nodes with smooth curves.

### 3. **Edit Anytime**
Modify workflows before, during, or even after execution!

---

## 🎯 How to Use Voice Editing

### Step 1: Create a Workflow

1. Click **"Start Recording"**
2. Say: "Get my Notion meeting notes and email me a summary"
3. Watch the workflow appear with animated nodes

### Step 2: Enter Edit Mode

1. Click the **"🎙️ Edit Workflow"** button
2. Button turns purple showing "✓ Edit Mode Active"
3. Voice input now edits instead of creating new workflow

### Step 3: Speak Your Edits

**Add a Node:**
- "Add a Slack notification step"
- "Add another summarize step before email"
- "Add a step to save to database"

**Remove a Node:**
- "Remove the email step"
- "Delete the summarize node"
- "Remove the last step"

**Modify a Node:**
- "Change the email to Slack"
- "Update the summary to be more detailed"

**Reorder Nodes:**
- "Move email to the end"
- "Put the summary after Notion fetch"

### Step 4: See Updates Instantly

- Workflow graph updates in real-time
- New nodes animate in smoothly
- Edges reconnect automatically
- Execution logs show the update

### Step 5: Run or Edit More

- Click **"Edit Workflow"** again to exit edit mode
- Click **"Run Workflow"** to execute
- Or keep editing with more voice commands!

---

## 🎨 Beautiful Edge Connections

### What's New:

**Gradient Colors:**
- Purple to Blue gradient (`#8b5cf6` → `#6366f1`)
- Smooth animated flow
- Arrow markers on endpoints

**Curved Paths:**
- Smooth "smoothstep" curves
- No more straight boring lines
- Professional graph appearance

**Dynamic Animation:**
- Flowing dots along edges
- Subtle pulsing effect
- Shows data flow direction

---

## 💡 Voice Edit Examples

### Adding Nodes

```
"Add a Slack notification after the email"
"Insert a webhook call before email"
"Add another LLM step to format the output"
```

### Removing Nodes

```
"Remove the email step"
"Delete step 2"
"Get rid of the Slack notification"
```

### Modifying Nodes

```
"Change the email recipient"
"Update the summary prompt to be shorter"
"Make the email subject more descriptive"
```

### Complex Edits

```
"Add a step to save results to Notion and then email them"
"Replace the email with a Slack message and add logging"
"Remove the summary and add two analysis steps instead"
```

---

## 🧠 How It Works

### Architecture:

1. **Voice Recording** → Groq Whisper transcription
2. **Edit Command** → Sent to `/api/edit-workflow`
3. **Cerebras AI** → Understands intent and modifies JSON
4. **State Update** → React re-renders workflow graph
5. **Visual Feedback** → Smooth animations show changes

### The AI Understands:

- ✅ Add operations (insert, add, include)
- ✅ Remove operations (delete, remove, get rid of)
- ✅ Modify operations (change, update, edit)
- ✅ Reorder operations (move, swap, put)
- ✅ Complex combinations of multiple operations

---

## 🎪 Advanced Features

### Edit After Execution

You can edit workflows even after they've run:
1. Workflow completes execution
2. Click "Edit Workflow"
3. Add new steps or modify existing ones
4. Run again with the updated workflow

### Non-Destructive Editing

- Original workflow is preserved in state
- Changes are applied incrementally
- Undo by clicking "Reset"

### Smart Edge Management

Edges automatically:
- Connect new nodes sequentially
- Reconnect when nodes are removed
- Maintain logical flow order
- Avoid orphaned nodes

---

## 🎨 UI/UX Highlights

### Edit Mode Indicators:

**Purple Theme:**
- Button turns purple when active
- Purple badge shows "🎤 Edit Mode Active"
- Purple border around voice input
- Purple gradient on recording button

**Visual Feedback:**
- Helper text shows example commands
- Loading spinner during AI processing
- Success message after update
- Animated node additions/removals

**Smart Disabling:**
- Can't run workflow while in edit mode
- Edit button disabled during execution
- Clear state management

---

## 🐛 Error Handling

The feature includes comprehensive error handling:

**If voice command is unclear:**
- Cerebras AI attempts to infer intent
- Falls back to closest match
- Shows error if completely ambiguous

**If edit fails:**
- Original workflow is preserved
- Error message shown in logs
- Can retry with clearer command

**If node reference is invalid:**
- AI suggests closest matching node
- Shows which nodes exist
- Guides user to correct command

---

## 🔮 Future Enhancements

Potential additions (not yet implemented):

- [ ] Visual node selector (click to edit)
- [ ] Drag-and-drop reordering
- [ ] Undo/Redo stack
- [ ] Workflow version history
- [ ] Voice command suggestions
- [ ] Multi-branch workflows
- [ ] Conditional logic nodes

---

## 📊 Technical Details

### API Endpoint

**`POST /api/edit-workflow`**

Request:
```json
{
  "text": "Add a Slack notification",
  "currentWorkflow": { /* existing workflow JSON */ }
}
```

Response:
```json
{
  "workflow": { /* updated workflow JSON */ },
  "success": true,
  "message": "Workflow updated successfully"
}
```

### State Management

```typescript
const [isEditMode, setIsEditMode] = useState(false);
const [isEditingWorkflow, setIsEditingWorkflow] = useState(false);
```

- `isEditMode`: UI shows edit controls
- `isEditingWorkflow`: AI processing edit command

### Component Updates

- `VoiceInput`: Accepts `isEditMode` prop
- `WorkflowCanvas`: Enhanced edge styling
- `page.tsx`: New edit functions and UI

---

## 🎯 Best Practices

### For Clear Voice Commands:

1. **Be specific:** "Add email step" → "Add an email step after the summary"
2. **Use node labels:** Reference by what they do, not ID
3. **One change at a time:** Easier for AI to understand
4. **Speak naturally:** No need for technical jargon

### For Best Results:

- ✅ Wait for transcription to complete
- ✅ Verify the update before executing
- ✅ Use edit mode instead of recreating
- ✅ Exit edit mode before running

### Common Pitfalls:

- ❌ Don't say "node step-2" (use "email step")
- ❌ Don't make multiple edits in one command
- ❌ Don't edit while workflow is executing
- ❌ Don't forget to exit edit mode

---

## 🎉 Try It Now!

1. Create a workflow with voice
2. Click **"🎙️ Edit Workflow"**
3. Say: "Add a Slack notification step"
4. Watch the magic happen! ✨

---

**Built with:** Cerebras AI, Groq Whisper, React Flow, Framer Motion
**Status:** ✅ Fully Functional & Production Ready

