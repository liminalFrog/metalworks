import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as path from 'path';
import * as fs from 'fs/promises';

// Add this somewhere near your imports in main.ts:
declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
}

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

// Store recent files (max 10)
const MAX_RECENT_FILES = 10;
let recentFiles: string[] = [];

// Load recent files from config
const loadRecentFiles = async (): Promise<string[]> => {
  try {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, 'recent-files.json');
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

// Save recent files to config
const saveRecentFiles = async (): Promise<void> => {
  try {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, 'recent-files.json');
    await fs.writeFile(filePath, JSON.stringify(recentFiles), 'utf8');
  } catch (error) {
    console.error('Error saving recent files:', error);
  }
};

// Add a file to recent files
const addRecentFile = async (filePath: string): Promise<void> => {
  // Remove if already exists (to move it to the top)
  recentFiles = recentFiles.filter(file => file !== filePath);
  
  // Add to the top
  recentFiles.unshift(filePath);
  
  // Limit the number of recent files
  if (recentFiles.length > MAX_RECENT_FILES) {
    recentFiles = recentFiles.slice(0, MAX_RECENT_FILES);
  }
  
  await saveRecentFiles();
};

// Remove a file from recent files
const removeRecentFile = async (filePath: string): Promise<void> => {
  recentFiles = recentFiles.filter(file => file !== filePath);
  await saveRecentFiles();
};

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    icon: path.join(process.env.APP_ROOT, process.platform === 'win32' ? 'build/icons/win/icon.ico' : process.platform === 'darwin' ? 'build/icons/mac/icon.icns' : 'build/icons/png/512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: true,
      contextIsolation: false
    },
    // Add these options to remove the default toolbar
    frame: true,
    autoHideMenuBar: true,
  });

  // Remove the default menu bar
  Menu.setApplicationMenu(null);

  // and load the index.html of the app.
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    // Open DevTools
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  // Register file type association
  app.setAsDefaultProtocolClient('metalworks');
  
  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });

  // Test active push message to Renderer-process.
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  // Handle window close with custom logic
  let closeAttempts = 0;
  const MAX_CLOSE_ATTEMPTS = 3;

  mainWindow.on('close', (event) => {
    console.log('Window close event triggered, isQuitting:', app.isQuitting);
    closeAttempts++;
    
    if (app.isQuitting) {
      console.log('isQuitting flag is true, allowing close');
      return true;
    }
    
    if (closeAttempts >= MAX_CLOSE_ATTEMPTS) {
      console.log('Max close attempts reached, forcing app to quit');
      app.exit(0);
      return true;
    }
    
    // Prevent the default close behavior
    event.preventDefault();
    console.log('Sending app-close-requested to renderer');
    mainWindow?.webContents.send('app-close-requested');
    return false;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(async () => {
  // Load recent files
  recentFiles = await loadRecentFiles();
  
  createWindow();

  // Register file handlers
  ipcMain.handle('open-file-dialog', async () => {
    if (!mainWindow) return { canceled: true };
    
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'MetalWorks JSON', extensions: ['mwj'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    return result;
  });

  ipcMain.handle('save-file-dialog', async () => {
    if (!mainWindow) return { canceled: true };
    
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'MetalWorks JSON', extensions: ['mwj'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    return result;
  });

  ipcMain.handle('read-file', async (_event, filePath: string) => {
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  });

  ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  });

  ipcMain.handle('get-recent-files', async () => {
    return recentFiles;
  });

  ipcMain.handle('add-recent-file', async (_event, filePath: string) => {
    await addRecentFile(filePath);
    return true;
  });

  ipcMain.handle('remove-recent-file', async (_event, filePath: string) => {
    await removeRecentFile(filePath);
    return true;
  });

  ipcMain.handle('clear-recent-files', async () => {
    recentFiles = [];
    await saveRecentFiles();
    return true;
  });

  ipcMain.on('confirm-close-app', () => {
    console.log('Main process received confirm-close-app');
    app.isQuitting = true;
    
    // Force quit after a short delay if normal close doesn't work
    setTimeout(() => {
      console.log('Checking if app needs to be force quit...');
      if (mainWindow) {
        console.log('Force quitting app');
        app.exit(0); // Force quit the entire app
      }
    }, 500);
    
    // Try normal close first
    if (mainWindow) {
      console.log('Attempting normal window close');
      mainWindow.destroy(); // More forceful than .close()
    }
  });

  // Set up a way to manually force quit during development
  if (VITE_DEV_SERVER_URL) {
    // In development, register a global shortcut to force quit
    const { globalShortcut } = require('electron');
    globalShortcut.register('CommandOrControl+Shift+Q', () => {
      console.log('Force quitting app via shortcut');
      app.exit(0);
    });
  }

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow();
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle file open from file explorer or OS
app.on('will-finish-launching', () => {
  app.on('open-file', (event, path) => {
    event.preventDefault();
    if (mainWindow) {
      mainWindow.webContents.send('open-file', path);
    } else {
      // Store the path to open once the window is created
      (global as any).fileToOpen = path;
    }
  });
});

// Add this to allow the app to quit properly:
app.on('before-quit', () => {
  app.isQuitting = true;
});
