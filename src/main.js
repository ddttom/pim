import { app, BrowserWindow, ipcMain, clipboard } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import JsonDatabaseService from './services/json-database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let db;

// Initialize database
async function initializeDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'data', 'pim.db');
  db = new JsonDatabaseService(dbPath);
  await db.initialize();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  await initializeDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle IPC events
ipcMain.handle('get-settings', async () => {
  // Return default settings
  return {
    advanced: {
      sidebarCollapsed: false,
      darkMode: false,
      fontSize: 14,
      lineHeight: 1.6
    },
    sync: {
      enabled: false,
      interval: 5,
      lastSync: null,
      autoSync: false,
      syncOnStart: false,
      syncOnSave: false
    },
    editor: {
      spellCheck: true,
      autoSave: true,
      saveInterval: 30,
      defaultFormat: 'markdown'
    }
  };
});

ipcMain.handle('update-settings', async (event, settings) => {
  try {
    // In a real app, save settings to storage here
    return settings;
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
});

ipcMain.handle('get-entries', async () => {
  try {
    return await db.getEntries();
  } catch (error) {
    console.error('Failed to get entries:', error);
    throw error;
  }
});

ipcMain.handle('copy-to-clipboard', async (event, text) => {
  try {
    clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
});

ipcMain.handle('add-entry', async (event, entry) => {
  try {
    const id = await db.addEntry(entry);
    const newEntry = await db.getEntry(id);
    mainWindow.webContents.send('entries-changed');
    return newEntry;
  } catch (error) {
    console.error('Failed to add entry:', error);
    throw error;
  }
});

ipcMain.handle('get-entry', async (event, id) => {
  try {
    return await db.getEntry(id);
  } catch (error) {
    console.error('Failed to get entry:', error);
    throw error;
  }
});

ipcMain.handle('update-entry', async (event, entry) => {
  try {
    const { id, ...updates } = entry;
    const updatedEntry = await db.updateEntry(id, updates);
    mainWindow.webContents.send('entries-changed');
    return updatedEntry;
  } catch (error) {
    console.error('Failed to update entry:', error);
    throw error;
  }
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    // Save settings to storage
    return settings;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return null;
  }
});
