# Voice Vibe with AI

**Hardened prototype** - Voice-controlled conversations with Claude AI

## Features ✨

- 🎤 **Voice Input** - Speak naturally, no typing needed
- 🚨 **"Send it" Trigger** - Say "send it" to submit your message
- 🔊 **TTS Readback** - Claude reads responses back to you
- ⚡ **Speed Control** - Adjust playback speed (1.0x - 2.0x)
- 📍 **Draggable UI** - Move controls anywhere on screen
- 💾 **Persistent Settings** - Remembers your speed and speaker preferences

## Installation

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `C:\VoiceVibe` folder
5. Go to https://claude.ai
6. You should see three controls on the left side of the screen

## How to Use

### Basic Workflow
1. **Click the 🎤 mic button** - Turns red when listening
2. **Speak your message** - Talk naturally
3. **Say "send it"** - Your message submits automatically
4. **Claude responds** - If speaker is on, response is read aloud
5. **Mic auto-restarts** - Ready for your next message

### Controls
- **🎤 Mic (Top)** 
  - Gray = Off
  - Red = Listening
  - Yellow = Processing
  - Green = Reading response
  - Click to toggle on/off

- **🔊 Speaker (Middle)**
  - Green = TTS enabled
  - Gray = TTS disabled
  - Click to toggle

- **⚡ Speed (Bottom)**
  - Shows current playback speed
  - Click to cycle: 1.0x → 1.25x → 1.5x → 1.75x → 2.0x

### Drag to Reposition
- Click and hold any control
- Drag to move the entire group
- All three controls move together

## Technical Details

### What Makes This "Hardened"
- **`isProcessing` flag** - Prevents mic from restarting during send/wait/read cycle
- **`triggerDetected` flag** - Stops duplicate "send it" detection
- **Multiple selector fallbacks** - Tries 7 different selectors to find Claude's messages
- **Robust response detection** - Waits for text to stabilize and checks streaming indicators
- **Chrome TTS workarounds** - Handles Chrome's quirky pause/resume behavior
- **Persistent preferences** - Uses Chrome storage to remember your settings

### Browser Support
- Chrome/Edge (required for Web Speech API)
- Works on claude.ai only

## Troubleshooting

**Mic won't start:**
- Refresh the page
- Make sure you allowed microphone permissions
- Check Chrome console for errors (F12)

**"Send it" not working:**
- Make sure mic is red (listening)
- Speak clearly and pause after "send it"
- Check console logs to see if trigger was detected

**No TTS playback:**
- Check if speaker button is green (enabled)
- Verify system volume is up
- Look for voice list in console on page load

**Extension not loading:**
- Go to chrome://extensions
- Click the refresh button on Voice Vibe
- Hard refresh Claude (Ctrl+Shift+R)

## Development Roadmap

### Current Version (v1.0.0)
✅ Voice input with "send it" trigger
✅ TTS readback with speed control
✅ Speaker toggle
✅ Draggable UI
✅ Persistent settings

### Planned Features
- 📝 Phase 2: Inline transcript display (words appear as you speak)
- ⌨️ Phase 3: Hotkey support (trigger without saying "send it")
- 🌐 Phase 4: ChatGPT & Google Gemini support
- ✍️ Phase 5: Advanced punctuation (verbalize or auto-punctuate)

## Files

- `content.js` - Main logic (speech recognition, TTS, UI)
- `background.js` - Service worker (settings initialization)
- `manifest.json` - Extension configuration
- `styles.css` - Minimal CSS (most styling is inline)
- `popup.html` - Extension popup UI
- `popup.js` - Popup logic

## Notes

- Requires microphone permission on first use
- TTS voices loaded asynchronously (check console for list)
- Default voice is index 6 (can be changed in code)
- Settings saved to Chrome local storage

---

## Privacy Policy

**VoiceVibe AI for Claude - Privacy Policy**

Last Updated: January 15, 2026

### Our Commitment
VoiceVibe AI respects your privacy. We believe your conversations with Claude AI are private, and we've built this extension to keep them that way.

### What We Collect
Nothing. We collect zero data from users.

### What We Access
To function, VoiceVibe AI requires:
- **Microphone Access** - To capture your voice input using your browser's Web Speech API
- **Claude.ai Page Access** - To insert text and read Claude's responses
- **Local Storage** - To save your settings (trigger phrase, hotkey preference, voice selection) on your device only

### What We Don't Do
- We don't record your voice
- We don't store your conversations
- We don't send any data to external servers
- We don't use cookies or tracking
- We don't collect analytics or usage statistics
- We don't share anything with third parties (because we have nothing to share)
---
### How Your Data is Processed
All speech recognition is handled by your browser's built-in Web Speech API. Your voice never leaves your device. Text-to-speech is also handled locally by your browser.

When you speak, your browser converts speech to text. That text is inserted into Claude's input box - the same as if you had typed it. Your conversation with Claude follows Claude/Anthropic's privacy policy, not ours, because we never see it.

### Contact
Questions about privacy? Email voicevibeai@gmail.com

### Open Source
Our code is available for review on GitHub: https://github.com/voice-vibe-ai/voicevibe-claude
**Version:** 1.0.0 (Hardened Prototype)
**Last Updated:** January 2025
