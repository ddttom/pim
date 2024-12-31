import { app, BrowserWindow, ipcMain, clipboard, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import JsonDatabaseService from './services/json-database.js';
import SyncService from './services/sync.js';
import { getSettings, saveSettings } from './services/settings-service.js';
import parser from './services/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let db;
let syncService;

// Initialize services
async function initializeServices() {
  const dbPath = path.join(app.getPath('userData'), 'data', 'pim.db');
  const settingsPath = path.join(app.getPath('userData'), 'data', 'settings.json');
  
  // Initialize database
  db = new JsonDatabaseService(dbPath);
  await db.initialize();
  
  // Initialize sync service
  syncService = new SyncService(dbPath, settingsPath);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,  // 1200 * 1.2
    height: 960,  // 800 * 1.2
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    minWidth: 1440,  // Set minimum size to match initial size
    minHeight: 960
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  await initializeServices();
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
  try {
    return await getSettings();
  } catch (error) {
    console.error('Failed to get settings:', error);
    throw error;
  }
});

ipcMain.handle('update-settings', async (event, settings) => {
  try {
    return await saveSettings(settings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
});

// Sync IPC handlers
ipcMain.handle('sync-data', async (event, { provider, settings }) => {
  try {
    await syncService.sync(provider);
    return { success: true };
  } catch (error) {
    console.error('Sync failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-backup', async () => {
  try {
    const paths = await syncService.createBackup();
    return { success: true, paths };
  } catch (error) {
    console.error('Backup failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restore-backup', async (event, backupPath) => {
  try {
    await syncService.restoreBackup(backupPath);
    return { success: true };
  } catch (error) {
    console.error('Restore failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  return await dialog.showOpenDialog(mainWindow, options);
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

ipcMain.handle('load-entry', async (event, id) => {
  try {
    const entry = await db.getEntry(id);
    if (!entry) throw new Error('Entry not found');
    
    // Import and show editor modal in renderer process
    event.sender.send('show-entry-preview', entry);
    return entry;
  } catch (error) {
    console.error('Failed to load entry:', error);
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

ipcMain.handle('delete-entry', async (event, id) => {
  try {
    await db.deleteEntry(id);
    mainWindow.webContents.send('entries-changed');
    return true;
  } catch (error) {
    console.error('Failed to delete entry:', error);
    throw error;
  }
});

ipcMain.handle('archive-entry', async (event, id) => {
  try {
    const entry = await db.getEntry(id);
    if (!entry) throw new Error('Entry not found');

    // Update entry with archived status and timestamp
    const updates = {
      ...entry,
      archived: true,
      archivedAt: new Date().toISOString()
    };

    const updatedEntry = await db.updateEntry(id, updates);
    mainWindow.webContents.send('entries-changed');
    return updatedEntry;
  } catch (error) {
    console.error('Failed to archive entry:', error);
    throw error;
  }
});

ipcMain.handle('test-parser', async (event, text) => {
  try {
    return parser.parse(text);
  } catch (error) {
    console.error('Failed to parse text:', error);
    throw error;
  }
});

// Handle edit-entry events
ipcMain.on('edit-entry', async (event, id) => {
  try {
    event.sender.send('edit-entry', id);
  } catch (error) {
    console.error('Failed to handle edit-entry:', error);
  }
});
