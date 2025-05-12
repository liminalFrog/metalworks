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
window.ipcRenderer = electron.ipcRenderer;
window.metalworks = {
  version: process.versions.electron
};
