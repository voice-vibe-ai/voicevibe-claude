// VoiceVibe AI - Settings Page Logic

// Default settings
const DEFAULT_SETTINGS = {
  triggerPhrase: 'send it',
  selectedHotkey: 'alt',
  hotkeyEnabled: true,
  selectedVoice: 'auto' // 'auto' or voice name
};

// DOM Elements
const triggerPhraseInput = document.getElementById('triggerPhrase');
const hotkeyRadios = document.getElementsByName('hotkey');
const hotkeyToggle = document.getElementById('hotkeyEnabled');
const voiceSelect = document.getElementById('voiceSelect');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const statusMessage = document.getElementById('statusMessage');

// Load settings on page load
document.addEventListener('DOMContentLoaded', () => {
  loadVoices();
  loadSettings();
});

// Save button handler
saveBtn.addEventListener('click', saveSettings);

// Reset button handler
resetBtn.addEventListener('click', resetSettings);

// Load available voices and populate dropdown
function loadVoices() {
  const synthesis = window.speechSynthesis;
  
  // Function to populate voices
  const populateVoices = () => {
    const voices = synthesis.getVoices();
    
    if (voices.length === 0) {
      // Voices not loaded yet, try again
      setTimeout(populateVoices, 100);
      return;
    }
    
    // Clear dropdown
    voiceSelect.innerHTML = '';
    
    // Add "Auto" option
    const autoOption = document.createElement('option');
    autoOption.value = 'auto';
    autoOption.textContent = 'Auto-select best voice (recommended)';
    voiceSelect.appendChild(autoOption);
    
    // Detect browser
    const isEdge = /Edg/.test(navigator.userAgent);
    
    // Add separator
    const separator = document.createElement('option');
    separator.disabled = true;
    separator.textContent = '─────────────────────────';
    voiceSelect.appendChild(separator);
    
    // Filter and sort voices
    const englishVoices = voices.filter(v => v.lang.startsWith('en'));
    
    // Prioritize good voices
    const premiumVoices = [];
    const regularVoices = [];
    
    englishVoices.forEach(voice => {
      const isPremium = voice.name.includes('Natural') || 
                       voice.name.includes('Neural') ||
                       voice.name.includes('Aria') ||
                       voice.name.includes('Jenny') ||
                       voice.name.includes('Guy') ||
                       voice.name.includes('Google');
      
      if (isPremium) {
        premiumVoices.push(voice);
      } else {
        regularVoices.push(voice);
      }
    });
    
    // Add premium voices first
    if (premiumVoices.length > 0) {
      const premiumLabel = document.createElement('option');
      premiumLabel.disabled = true;
      premiumLabel.textContent = isEdge ? 'Premium Edge Voices:' : 'Premium Voices:';
      voiceSelect.appendChild(premiumLabel);
      
      premiumVoices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `  ${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
      });
    }
    
    // Add regular voices
    if (regularVoices.length > 0) {
      const regularLabel = document.createElement('option');
      regularLabel.disabled = true;
      regularLabel.textContent = 'Standard Voices:';
      voiceSelect.appendChild(regularLabel);
      
      regularVoices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `  ${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
      });
    }
    
    console.log(`Loaded ${englishVoices.length} voices (${premiumVoices.length} premium, ${regularVoices.length} standard)`);
    
    // Load saved voice preference after voices are loaded
    chrome.storage.local.get(['selectedVoice'], (result) => {
      if (result.selectedVoice) {
        voiceSelect.value = result.selectedVoice;
      }
    });
  };
  
  // Start loading
  populateVoices();
  
  // Some browsers need this event
  synthesis.onvoiceschanged = populateVoices;
}

// Load settings from storage
function loadSettings() {
  chrome.storage.local.get(DEFAULT_SETTINGS, (result) => {
    // Trigger phrase
    triggerPhraseInput.value = result.triggerPhrase;
    
    // Hotkey selection
    for (const radio of hotkeyRadios) {
      if (radio.value === result.selectedHotkey) {
        radio.checked = true;
        break;
      }
    }
    
    // Hotkey toggle
    hotkeyToggle.checked = result.hotkeyEnabled;
    
    // Voice selection (will be set after voices load)
    if (result.selectedVoice) {
      voiceSelect.value = result.selectedVoice;
    }
    
    console.log('Settings loaded:', result);
  });
}

// Save settings to storage
function saveSettings() {
  // Get trigger phrase
  const triggerPhrase = triggerPhraseInput.value.trim().toLowerCase();
  
  // Validate trigger phrase
  if (!triggerPhrase) {
    showStatus('Trigger phrase cannot be empty!', 'error');
    return;
  }
  
  if (triggerPhrase.length < 3) {
    showStatus('Trigger phrase must be at least 3 characters!', 'error');
    return;
  }
  
  // Get selected hotkey
  let selectedHotkey = 'alt';
  for (const radio of hotkeyRadios) {
    if (radio.checked) {
      selectedHotkey = radio.value;
      break;
    }
  }
  
  // Get selected voice
  const selectedVoice = voiceSelect.value;
  
  // Build settings object
  const settings = {
    triggerPhrase: triggerPhrase,
    selectedHotkey: selectedHotkey,
    hotkeyEnabled: hotkeyToggle.checked,
    selectedVoice: selectedVoice
  };
  
  // Save to storage
  chrome.storage.local.set(settings, () => {
    console.log('Settings saved:', settings);
    showStatus('Settings saved successfully!', 'success');
    
    // Notify content scripts to reload settings
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'reloadSettings' }, () => {
          // Ignore errors for tabs that don't have the content script
          if (chrome.runtime.lastError) {
            // Silent fail
          }
        });
      });
    });
  });
}

// Reset to default settings
function resetSettings() {
  if (confirm('Reset all settings to defaults?')) {
    chrome.storage.local.set(DEFAULT_SETTINGS, () => {
      console.log('Settings reset to defaults');
      loadSettings();
      voiceSelect.value = 'auto';
      showStatus('Settings reset to defaults!', 'success');
    });
  }
}

// Show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.style.display = 'block';
  
  // Hide after 3 seconds
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 3000);
}