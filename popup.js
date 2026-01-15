// VoiceVibe AI - Popup Script

document.getElementById('settingsBtn').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById('helpBtn').addEventListener('click', () => {
  window.open('https://github.com/voice-vibe-ai/voicevibe-claude', '_blank');
});