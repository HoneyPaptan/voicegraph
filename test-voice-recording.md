# Voice Recording Test Guide

## 🎤 Testing Voice Edit Functionality

### **How to Test:**

1. **Start the Development Server:**
   ```bash
   ./run-all-dev.sh
   # OR
   cd frontend && npm run dev
   ```

2. **Open the Application:**
   - Go to `http://localhost:3000`
   - Make sure you have a workflow created first

3. **Test Voice Edit:**
   - Click on the **Mic button** in the workflow toolbar (second button)
   - You should see a dropdown with "Click to start recording your edit"
   - Click **"Start Recording"**
   - Speak your edit command (e.g., "add a summarize step after the first node")
   - Click **"Stop Recording"**
   - The system should process your voice and update the workflow

### **Expected Behavior:**

✅ **Before Fix:**
- Clicking "Stop Recording" just closed the dropdown
- No voice processing occurred
- No workflow editing happened

✅ **After Fix:**
- Clicking "Start Recording" begins actual voice recording
- Clicking "Stop Recording" processes the audio
- Voice is transcribed using Groq Whisper
- Workflow is edited using Cerebras AI
- Visual feedback shows recording/processing states

### **Debug Information:**

- Check browser console for recording logs
- Look for "Voice recording started" and "Voice recording stopped" messages
- Check network tab for API calls to `/api/transcribe` and `/api/edit-workflow`

### **Common Issues:**

1. **Microphone Permission:** Make sure browser allows microphone access
2. **API Keys:** Ensure Groq and Cerebras API keys are configured
3. **Network:** Check that MCP Gateway is running on port 3001

### **Test Commands:**

Try these voice commands:
- "add a summarize step"
- "remove the email node"
- "add a search step before the first node"
- "make the workflow faster"
