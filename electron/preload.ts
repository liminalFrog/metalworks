import { ipcRenderer, contextBridge } from 'electron'

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

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
});

// Expose any needed APIs to the renderer process
// Since you're using nodeIntegration: true, you likely don't need these
// but they're here for future-proofing
contextBridge.exposeInMainWorld('metalworks', {
  // Add any functions you want to expose to the renderer
  version: process.versions.electron
});
