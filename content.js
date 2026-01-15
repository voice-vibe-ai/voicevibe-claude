// VoiceVibe AI - for Claude
// Clean version with proper TTS handling

console.log('VoiceVibe AI - Loaded');

// === STATE ===
let micActive = false;
let isProcessing = false;
let triggerDetected = false;
let isRecognitionRunning = false;
let recognition = null;
let synthesis = window.speechSynthesis;
let lastTranscriptLength = 0;
let currentTranscript = ''; // NEW: Store current transcript for hotkey access

// Settings (loaded from storage)
let readbackSpeed = 1.5;
let readbackEnabled = false; // Changed to false - default OFF
let hotkeyEnabled = true;
let triggerPhrase = 'send it';
let selectedHotkey = 'alt';
let selectedVoice = 'auto'; // 'auto' or voice name

// UI positions
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let groupLeft = 20;
let groupBottom = 55;

// === GLASS PANEL CONTAINER ===
function createGlassPanel() {
  const panel = document.createElement('div');
  panel.id = 'vf-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: ${groupBottom}px;
    left: ${groupLeft}px;
    width: 50px;
    padding: 8px 0;
    border-radius: 14px;
    background: rgba(40, 40, 40, 0.85);
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 999999;
    user-select: none;
    cursor: grab;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  `;
  panel.addEventListener('mousedown', startDrag);
  document.body.appendChild(panel);
  return panel;
}

// === LOGO TEXT ===
function createLogoText() {
  const logo = document.createElement('div');
  logo.id = 'vf-logo';
  logo.innerHTML = `
    <div style="text-align: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.15); margin-bottom: 8px;">
      <div style="font-size: 10px; font-weight: 600; color: #fff; line-height: 1.1;">Voice</div>
      <div style="font-size: 10px; font-weight: 600; color: #fff; line-height: 1.1;">Vibe</div>
      <div style="font-size: 10px; font-weight: 600; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.1;">AI</div>
    </div>
  `;
  return logo;
}

// === MIC BUTTON ===
function createMicButton() {
  const mic = document.createElement('div');
  mic.id = 'vf-mic';
  mic.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>';
  mic.style.cssText = `
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #666;
    color: white;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
  `;
  mic.addEventListener('click', toggleMic);
  mic.addEventListener('mouseenter', () => mic.style.transform = 'scale(1.05)');
  mic.addEventListener('mouseleave', () => mic.style.transform = 'scale(1)');
  return mic;
}

// === SPEAKER BUTTON ===
function createSpeakerToggle() {
  const speaker = document.createElement('div');
  speaker.id = 'vf-speaker';
  
  const speakerOnSVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
  const speakerOffSVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
  
  speaker.innerHTML = readbackEnabled ? speakerOnSVG : speakerOffSVG;
  speaker.style.cssText = `
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: ${readbackEnabled ? '#4caf50' : '#666'};
    color: white;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s, transform 0.1s;
  `;
  speaker.addEventListener('click', toggleSpeaker);
  speaker.addEventListener('mouseenter', () => speaker.style.transform = 'scale(1.05)');
  speaker.addEventListener('mouseleave', () => speaker.style.transform = 'scale(1)');
  return speaker;
}

// === SPEED DISPLAY (text only) ===
function createSpeedControl() {
  const speed = document.createElement('div');
  speed.id = 'vf-speed';
  speed.textContent = `${readbackSpeed}x`;
  speed.style.cssText = `
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    transition: background 0.2s, transform 0.1s;
  `;
  speed.addEventListener('click', cycleSpeed);
  speed.addEventListener('mouseenter', () => {
    speed.style.background = 'rgba(255, 255, 255, 0.15)';
    speed.style.transform = 'scale(1.05)';
  });
  speed.addEventListener('mouseleave', () => {
    speed.style.background = 'rgba(255, 255, 255, 0.1)';
    speed.style.transform = 'scale(1)';
  });
  return speed;
}

// === TOGGLE FUNCTIONS ===
function toggleSpeaker() {
  readbackEnabled = !readbackEnabled;
  const speaker = document.getElementById('vf-speaker');
  if (speaker) {
    const speakerOnSVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
    const speakerOffSVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
    
    speaker.innerHTML = readbackEnabled ? speakerOnSVG : speakerOffSVG;
    speaker.style.background = readbackEnabled ? '#4caf50' : '#666';
  }
  chrome.storage.local.set({ readbackEnabled });
  console.log(readbackEnabled ? 'Speaker ON' : 'Speaker OFF');
  if (!readbackEnabled) synthesis.cancel();
}

function toggleMic() {
  const mic = document.getElementById('vf-mic');
  if (!mic) return;
  
  if (!micActive) {
    micActive = true;
    mic.style.background = '#d32f2f';
    lastTranscriptLength = 0;
    currentTranscript = ''; // Clear transcript when starting
    const silentUtterance = new SpeechSynthesisUtterance('');
    synthesis.speak(silentUtterance);
    startListening();
    console.log('Mic ON');
  } else {
    micActive = false;
    isProcessing = false;
    triggerDetected = false;
    mic.style.background = '#666';
    stopListening();
    synthesis.cancel();
    lastTranscriptLength = 0;
    currentTranscript = ''; // Clear transcript when stopping
    console.log('Mic OFF');
  }
}

function cycleSpeed() {
  const speeds = [1.0, 1.25, 1.5, 1.75, 2.0];
  const currentIndex = speeds.indexOf(readbackSpeed);
  readbackSpeed = speeds[(currentIndex + 1) % speeds.length];
  const speedEl = document.getElementById('vf-speed');
  if (speedEl) speedEl.textContent = `${readbackSpeed}x`;
  chrome.storage.local.set({ readbackSpeed });
  console.log('Speed:', readbackSpeed);
}

function setMicColor(color) {
  const mic = document.getElementById('vf-mic');
  if (mic) mic.style.background = color;
}

// === DRAG FUNCTIONS ===
let dragMoved = false;
function startDrag(e) {
  isDragging = false;
  dragMoved = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
  e.preventDefault();
}

function onDrag(e) {
  const deltaX = e.clientX - dragStartX;
  const deltaY = e.clientY - dragStartY;
  if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
    isDragging = true;
    dragMoved = true;
    groupLeft += deltaX;
    groupBottom -= deltaY;
    updatePanelPosition();
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  }
}

function stopDrag(e) {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  if (dragMoved) {
    setTimeout(() => { isDragging = false; }, 100);
  } else {
    isDragging = false;
  }
}

function updatePanelPosition() {
  const panel = document.getElementById('vf-panel');
  if (panel) {
    panel.style.left = `${groupLeft}px`;
    panel.style.bottom = `${groupBottom}px`;
  }
}

// === HOTKEY LISTENER - FIXED VERSION ===
function setupHotkeyListener() {
  document.addEventListener('keydown', (e) => {
    if (!hotkeyEnabled || !micActive || isProcessing) return;
    
    let hotkeyPressed = false;
    if (selectedHotkey === 'alt') {
      hotkeyPressed = e.altKey && !e.ctrlKey && !e.shiftKey && e.key === 'Enter';
    } else if (selectedHotkey === 'ctrl') {
      hotkeyPressed = e.ctrlKey && !e.altKey && !e.shiftKey && e.key === 'Enter';
    } else if (selectedHotkey === 'ctrlshift') {
      hotkeyPressed = e.ctrlKey && e.shiftKey && !e.altKey && e.key === 'Enter';
    }
    
    if (hotkeyPressed) {
      console.log('HOTKEY!', selectedHotkey);
      e.preventDefault();
      
      if (!triggerDetected) {
        triggerDetected = true;
        
        // Stop listening first
        stopListening();
        
        // Get the textarea
        const textarea = document.querySelector('[contenteditable="true"]');
        if (!textarea) {
          console.log('Hotkey: No textarea found');
          triggerDetected = false;
          return;
        }
        
        // Check what's already in the textarea
        const existingText = (textarea.textContent || '').trim();
        
        // If textarea is empty but we have a transcript, insert it
        if (!existingText && currentTranscript && currentTranscript.trim()) {
          console.log('Hotkey: Inserting transcript manually:', currentTranscript);
          textarea.focus();
          textarea.textContent = currentTranscript;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          // CRITICAL: Clear transcript immediately to prevent re-insertion
          currentTranscript = '';
          lastTranscriptLength = 0;
        }
        
        // Small delay for DOM to update, then process
        setTimeout(() => {
          handleTrigger();
        }, 200);
      }
    }
  });
  console.log('Hotkey setup');
}

// === TEXT INSERTION ===
function insertNewText(fullTranscript) {
  if (!micActive) return;
  const textarea = document.querySelector('[contenteditable="true"]');
  if (!textarea) return;
  
  const newText = fullTranscript.substring(lastTranscriptLength);
  if (!newText) return;
  
  if (document.activeElement !== textarea) textarea.focus();
  document.execCommand('insertText', false, newText);
  lastTranscriptLength = fullTranscript.length;
}

// === SPEECH RECOGNITION ===
function initRecognition() {
  if (!('webkitSpeechRecognition' in window)) {
    alert('Speech recognition not supported. Use Chrome.');
    return;
  }
  
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  recognition.onstart = () => {
    isRecognitionRunning = true;
    console.log('Listening');
  };
  
  recognition.onresult = (event) => {
    let fullTranscript = '';
    for (let i = 0; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        fullTranscript += event.results[i][0].transcript + ' ';
      }
    }
    
    // Store transcript globally for hotkey access
    currentTranscript = fullTranscript;
    
    if (fullTranscript) {
      console.log('Transcript:', fullTranscript);
      
      if (!triggerDetected && fullTranscript.toLowerCase().includes(triggerPhrase.toLowerCase())) {
        console.log('TRIGGER!', triggerPhrase);
        triggerDetected = true;
        const regex = new RegExp(triggerPhrase, 'gi');
        fullTranscript = fullTranscript.replace(regex, '').trim() + ' ';
        if (fullTranscript.trim()) {
          insertNewText(fullTranscript);
        }
        handleTrigger();
        return;
      }
      
      insertNewText(fullTranscript);
    }
  };
  
  recognition.onerror = (event) => {
    console.log('Recognition Error:', event.error);
    isRecognitionRunning = false;
  };
  
  recognition.onend = () => {
    isRecognitionRunning = false;
    if (micActive && !isProcessing) {
      setTimeout(startListening, 500);
    }
  };
}

function startListening() {
  if (isRecognitionRunning) return;
  try {
    recognition.start();
  } catch (e) {
    isRecognitionRunning = false;
  }
}

function stopListening() {
  if (!isRecognitionRunning) return;
  try {
    recognition.stop();
  } catch (e) {}
}

// === TRIGGER HANDLER ===
async function handleTrigger() {
  console.log('Trigger activated');
  isProcessing = true;
  stopListening();
  
  const textarea = document.querySelector('[contenteditable="true"]');
  if (!textarea) {
    console.error('No textarea found');
    resetAfterTrigger();
    return;
  }
  
  let fullText = textarea.textContent || '';
  const regex = new RegExp(triggerPhrase, 'gi');
  fullText = fullText.replace(regex, '').trim();
  
  // Clear textarea immediately after reading
  textarea.innerHTML = '';
  
  lastTranscriptLength = 0;
  currentTranscript = ''; // Clear transcript after processing
  
  if (!fullText) {
    console.log('No text to send');
    textarea.innerHTML = '';
    resetAfterTrigger();
    return;
  }
  
  console.log('Sending:', fullText);
  setMicColor('#f9a825');
  await submitMessage(fullText);
  
  // AGGRESSIVE CLEAR: Keep clearing the textarea for 2 seconds after sending
  let clearAttempts = 0;
  const aggressiveClear = setInterval(() => {
    const textarea = document.querySelector('[contenteditable="true"]');
    if (textarea) {
      textarea.innerHTML = '';
      textarea.textContent = '';
      textarea.blur();
    }
    clearAttempts++;
    if (clearAttempts >= 20) { // Clear 20 times over 2 seconds
      clearInterval(aggressiveClear);
    }
  }, 100);
  
  await waitForResponseAndRead();
}

function resetAfterTrigger() {
  isProcessing = false;
  triggerDetected = false;
  setTimeout(() => {
    if (micActive && !isRecognitionRunning) startListening();
  }, 1000);
}

// === SUBMIT MESSAGE ===
async function submitMessage(text) {
  try {
    const textarea = document.querySelector('[contenteditable="true"]');
    if (!textarea) return;
    
    textarea.innerHTML = '';
    textarea.focus();
    textarea.textContent = text;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    
    await sleep(200);
    
    const sendBtn = document.querySelector('button[aria-label*="Send"]') || 
                    document.querySelector('button[type="submit"]');
    if (!sendBtn) return;
    
    sendBtn.click();
    console.log('Message sent');
    
    // Extra clearing after send
    await sleep(300);
    textarea.blur();
    textarea.innerHTML = '';
    textarea.textContent = '';
    
    // One more clear after another delay
    await sleep(500);
    const textareaAgain = document.querySelector('[contenteditable="true"]');
    if (textareaAgain) {
      textareaAgain.innerHTML = '';
      textareaAgain.textContent = '';
    }
  } catch (error) {
    console.error('Submit error:', error);
  }
}

// === WAIT FOR RESPONSE ===
async function waitForResponseAndRead() {
  console.log('Waiting for response...');
  setMicColor('#f9a825');
  
  const getMessages = () => {
    const selectors = [
      '[data-testid="chat-message-content"]',
      '.font-claude-message',
      '.standard-markdown',
      '[class*="prose"]',
      '[data-message-author="assistant"]'
    ];
    
    for (const selector of selectors) {
      const messages = document.querySelectorAll(selector);
      if (messages.length > 0) return messages;
    }
    return [];
  };
  
  const initialCount = getMessages().length;
  console.log('Initial message count:', initialCount);
  
  let attempts = 0;
  let responseText = '';
  let lastTextLength = 0;
  let stableCount = 0;
  
  while (attempts < 180) { // 90 seconds
    await sleep(500);
    attempts++;
    const messages = getMessages();
    
    if (messages.length > initialCount) {
      const text = messages[messages.length - 1].textContent || '';
      const isStreaming = document.querySelector('[data-is-streaming="true"]');
      
      if (text.length === lastTextLength && !isStreaming) {
        stableCount++;
        if (stableCount >= 3 && text.length > 10) {
          responseText = text;
          console.log('Response complete');
          break;
        }
      } else {
        stableCount = 0;
        lastTextLength = text.length;
      }
    }
  }
  
  if (responseText && readbackEnabled) {
    console.log('TTS enabled, starting readback');
    await readResponse(responseText);
  } else if (!responseText) {
    console.log('No response detected');
  } else {
    console.log('TTS disabled');
  }
  
  isProcessing = false;
  triggerDetected = false;
  lastTranscriptLength = 0;
  
  if (micActive) {
    setMicColor('#d32f2f');
    startListening();
    console.log('Ready for input');
  }
}

// === TEXT-TO-SPEECH ===
function getBestVoice() {
  const voices = synthesis.getVoices();
  const isEdge = /Edg/.test(navigator.userAgent);
  
  console.log(`Browser: ${isEdge ? 'Edge' : 'Chrome'}`);
  console.log(`Available voices: ${voices.length}`);
  
  // Log all English voices for debugging
  voices.forEach((v, i) => {
    if (v.lang.startsWith('en')) {
      console.log(`  ${i}: ${v.name} (${v.lang})${v.localService ? '' : ' [cloud]'}`);
    }
  });
  
  let selectedVoiceObj = null;
  
  // Check if user has a saved voice preference (and it's not 'auto')
  if (selectedVoice && selectedVoice !== 'auto') {
    selectedVoiceObj = voices.find(v => v.name === selectedVoice);
    if (selectedVoiceObj) {
      console.log(`Using saved voice: ${selectedVoiceObj.name}`);
      return selectedVoiceObj;
    } else {
      console.log(`Saved voice "${selectedVoice}" not found, using auto-select`);
    }
  }
  
  // Auto-select best voice for browser
  if (isEdge) {
    // Edge: Look for Liam first (user's preferred voice)
    selectedVoiceObj = voices.find(v => 
      v.name.includes('Liam')
    );
    
    if (!selectedVoiceObj) {
      // Fallback to other premium Microsoft Azure voices
      selectedVoiceObj = voices.find(v => 
        v.name.includes('Microsoft') && 
        (v.name.includes('Aria') || v.name.includes('Jenny') || v.name.includes('Guy'))
      );
    }
    
    if (!selectedVoiceObj) {
      // Final fallback to any good Microsoft voice
      selectedVoiceObj = voices.find(v => 
        v.name.includes('Microsoft') && 
        v.lang.startsWith('en') &&
        !v.name.includes('David') && // Skip older voices
        !v.name.includes('Zira')
      );
    }
  } else {
    // Chrome: Look for Google UK English Male first (user preference)
    selectedVoiceObj = voices.find(v => 
      v.name.includes('Google UK English Male')
    );
    
    if (!selectedVoiceObj) {
      // Fallback to any Google US English voice
      selectedVoiceObj = voices.find(v => 
        v.name.includes('Google') && 
        v.lang === 'en-US'
      );
    }
    
    if (!selectedVoiceObj) {
      // Fallback to any decent system voice
      selectedVoiceObj = voices.find(v => 
        v.lang.startsWith('en') && 
        v.localService
      );
    }
  }
  
  // Final fallback: First English voice
  if (!selectedVoiceObj) {
    selectedVoiceObj = voices.find(v => v.lang.startsWith('en'));
  }
  
  if (selectedVoiceObj) {
    console.log(`Auto-selected voice: ${selectedVoiceObj.name}`);
  } else {
    console.log('No voice found, using default');
  }
  
  return selectedVoiceObj;
}

function readResponse(text) {
  return new Promise((resolve) => {
    if (!readbackEnabled) {
      console.log('TTS disabled');
      resolve();
      return;
    }
    
    let cleanText = text
      .replace(/```[\s\S]*?```/g, ' code block ')
      .replace(/`[^`]+`/g, '')
      .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!cleanText) {
      console.log('No text to read');
      resolve();
      return;
    }
    
    console.log('Speaking text');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = readbackSpeed;
    
    // Use smart voice selection
    const bestVoice = getBestVoice();
    if (bestVoice) utterance.voice = bestVoice;
    
    utterance.onstart = () => {
      setMicColor('#4caf50');
      console.log('TTS started');
    };
    
    utterance.onend = () => {
      console.log('TTS finished');
      resolve();
    };
    
    utterance.onerror = (e) => {
      console.log('TTS error:', e.error);
      resolve();
    };
    
    synthesis.cancel();
    if (synthesis.paused) synthesis.resume();
    setTimeout(() => synthesis.speak(utterance), 150);
  });
}

// === UTILITY ===
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// === SETTINGS ===
function loadSettings() {
  chrome.storage.local.get({
    readbackSpeed: 1.5,
    readbackEnabled: false, // Default OFF
    hotkeyEnabled: true,
    triggerPhrase: 'send it',
    selectedHotkey: 'alt',
    selectedVoice: 'auto'
  }, (result) => {
    readbackSpeed = result.readbackSpeed;
    readbackEnabled = result.readbackEnabled;
    hotkeyEnabled = result.hotkeyEnabled;
    triggerPhrase = result.triggerPhrase;
    selectedHotkey = result.selectedHotkey;
    selectedVoice = result.selectedVoice;
    
    console.log('Settings loaded:', { 
      triggerPhrase, 
      selectedHotkey, 
      readbackSpeed, 
      readbackEnabled,
      selectedVoice 
    });
    
    // Update speaker button to match loaded setting
    const speaker = document.getElementById('vf-speaker');
    if (speaker) {
      const speakerOnSVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
      const speakerOffSVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
      
      speaker.innerHTML = readbackEnabled ? speakerOnSVG : speakerOffSVG;
      speaker.style.background = readbackEnabled ? '#4caf50' : '#666';
    }
    
    // Update speed display
    const speedEl = document.getElementById('vf-speed');
    if (speedEl) speedEl.textContent = `${readbackSpeed}x`;
  });
}

// === INIT ===
function init() {
  console.log('VoiceVibe AI initializing');
  
  loadSettings();
  initRecognition();
  
  // Create panel and add all elements to it
  const panel = createGlassPanel();
  panel.appendChild(createLogoText());
  panel.appendChild(createMicButton());
  panel.appendChild(createSpeakerToggle());
  panel.appendChild(createSpeedControl());
  
  setupHotkeyListener();
  
  // Listen for settings changes
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'reloadSettings') {
      loadSettings();
      console.log('Settings reloaded');
      sendResponse({ success: true });
    }
  });
  
  console.log('VoiceVibe AI ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
