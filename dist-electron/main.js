import { app, ipcMain, dialog, BrowserWindow, Menu } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import * as path from "path";
import * as fs from "fs/promises";
const require2 = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let mainWindow = null;
const MAX_RECENT_FILES = 10;
let recentFiles = [];
const loadRecentFiles = async () => {
  try {
    const userDataPath = app.getPath("userData");
    const filePath = path.join(userDataPath, "recent-files.json");
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};
const saveRecentFiles = async () => {
  try {
    const userDataPath = app.getPath("userData");
    const filePath = path.join(userDataPath, "recent-files.json");
    await fs.writeFile(filePath, JSON.stringify(recentFiles), "utf8");
  } catch (error) {
    console.error("Error saving recent files:", error);
  }
};
const addRecentFile = async (filePath) => {
  recentFiles = recentFiles.filter((file) => file !== filePath);
  recentFiles.unshift(filePath);
  if (recentFiles.length > MAX_RECENT_FILES) {
    recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
  }
  await saveRecentFiles();
};
const removeRecentFile = async (filePath) => {
  recentFiles = recentFiles.filter((file) => file !== filePath);
  await saveRecentFiles();
};
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      nodeIntegration: true,
      contextIsolation: false
    },
    // Add these options to remove the default toolbar
    frame: true,
    autoHideMenuBar: true
  });
  Menu.setApplicationMenu(null);
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  app.setAsDefaultProtocolClient("metalworks");
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow == null ? void 0 : mainWindow.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  let closeAttempts = 0;
  const MAX_CLOSE_ATTEMPTS = 3;
  mainWindow.on("close", (event) => {
    console.log("Window close event triggered, isQuitting:", app.isQuitting);
    closeAttempts++;
    if (app.isQuitting) {
      console.log("isQuitting flag is true, allowing close");
      return true;
    }
    if (closeAttempts >= MAX_CLOSE_ATTEMPTS) {
      console.log("Max close attempts reached, forcing app to quit");
      app.exit(0);
      return true;
    }
    event.preventDefault();
    console.log("Sending app-close-requested to renderer");
    mainWindow == null ? void 0 : mainWindow.webContents.send("app-close-requested");
    return false;
  });
}
app.whenReady().then(async () => {
  recentFiles = await loadRecentFiles();
  createWindow();
  ipcMain.handle("open-file-dialog", async () => {
    if (!mainWindow) return { canceled: true };
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        { name: "MetalWorks JSON", extensions: ["mwj"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    return result;
  });
  ipcMain.handle("save-file-dialog", async () => {
    if (!mainWindow) return { canceled: true };
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: "MetalWorks JSON", extensions: ["mwj"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    return result;
  });
  ipcMain.handle("read-file", async (_event, filePath) => {
    const content = await fs.readFile(filePath, "utf8");
    return content;
  });
  ipcMain.handle("write-file", async (_event, filePath, content) => {
    await fs.writeFile(filePath, content, "utf8");
    return true;
  });
  ipcMain.handle("get-recent-files", async () => {
    return recentFiles;
  });
  ipcMain.handle("add-recent-file", async (_event, filePath) => {
    await addRecentFile(filePath);
    return true;
  });
  ipcMain.handle("remove-recent-file", async (_event, filePath) => {
    await removeRecentFile(filePath);
    return true;
  });
  ipcMain.handle("clear-recent-files", async () => {
    recentFiles = [];
    await saveRecentFiles();
    return true;
  });
  ipcMain.on("confirm-close-app", () => {
    console.log("Main process received confirm-close-app");
    app.isQuitting = true;
    setTimeout(() => {
      console.log("Checking if app needs to be force quit...");
      if (mainWindow) {
        console.log("Force quitting app");
        app.exit(0);
      }
    }, 500);
    if (mainWindow) {
      console.log("Attempting normal window close");
      mainWindow.destroy();
    }
  });
  if (VITE_DEV_SERVER_URL) {
    const { globalShortcut } = require2("electron");
    globalShortcut.register("CommandOrControl+Shift+Q", () => {
      console.log("Force quitting app via shortcut");
      app.exit(0);
    });
  }
  app.on("activate", () => {
    if (mainWindow === null) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("will-finish-launching", () => {
  app.on("open-file", (event, path2) => {
    event.preventDefault();
    if (mainWindow) {
      mainWindow.webContents.send("open-file", path2);
    } else {
      global.fileToOpen = path2;
    }
  });
});
app.on("before-quit", () => {
  app.isQuitting = true;
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
