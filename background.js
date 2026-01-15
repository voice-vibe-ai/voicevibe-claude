// Background service worker for Voice Vibe with AI

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Voice Vibe with AI installed!');
  
  // Set default settings
  chrome.storage.local.get(['trigger_phrase', 'readbackSpeed', 'readbackEnabled'], (result) => {
    const defaults = {};
    
    if (!result.trigger_phrase) {
      defaults.trigger_phrase = 'send it';
    }
    if (!result.readbackSpeed) {
      defaults.readbackSpeed = 1.5;
    }
    if (result.readbackEnabled === undefined) {
      defaults.readbackEnabled = true;
    }
    
    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults);
    }
  });
});

// Handle messages from content script if needed
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'log') {
    console.log('Log:', request.message);
  }
  
  return true;
});
