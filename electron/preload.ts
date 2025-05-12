import { ipcRenderer } from 'electron'

// Called when DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
  console.log('MetalWorks is ready!');
  
  // You can add DOM manipulation here if needed
  // For example, you could check if there's a file to open on startup:
  const fileToOpen = (window as any).fileToOpen;
  if (fileToOpen) {
    // Notify the renderer process
    document.dispatchEvent(
      new CustomEvent('file-to-open', { detail: fileToOpen })
    );
  }
});

// --------- Make ipcRenderer directly available since we're using nodeIntegration: true ---------
// Since contextIsolation is false, we'll make ipcRenderer directly accessible to the window object
// rather than using contextBridge
(window as any).ipcRenderer = ipcRenderer;

// Add any additional utilities to the window object if needed
(window as any).metalworks = {
  version: process.versions.electron
};
