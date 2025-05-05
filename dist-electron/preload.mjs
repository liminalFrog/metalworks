"use strict";
const electron = require("electron");
window.addEventListener("DOMContentLoaded", () => {
  console.log("MetalWorks is ready!");
  const fileToOpen = window.fileToOpen;
  if (fileToOpen) {
    document.dispatchEvent(
      new CustomEvent("file-to-open", { detail: fileToOpen })
    );
  }
});
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
electron.contextBridge.exposeInMainWorld("metalworks", {
  // Add any functions you want to expose to the renderer
  version: process.versions.electron
});
