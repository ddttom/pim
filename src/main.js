import { app, BrowserWindow, ipcMain, clipboard, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import JsonDatabaseService from './services/json-database.js';
import SyncService from './services/sync.js';
import { getSettings, saveSettings, setSettingsPath } from './services/settings-service.js';
import parser from './services/parser.js';
import { ConfigManager } from './services/config-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let db;
let syncService;
let configManager;

// Initialize services
async function initializeServices() {
  // Initialize config manager first
  configManager = new ConfigManager(app.getPath('userData'));
  await configManager.initialize();

  // Get data path from config
  const dataPath = await configManager.getDataPath();
  
  const dbPath = path.join(dataPath, 'pim.db');
  const settingsPath = path.join(dataPath, 'settings.json');
  const imagesPath = path.join(dataPath, 'images');
  
  // Ensure data directories exist
  try {
    await fs.mkdir(dataPath, { recursive: true });
    await fs.mkdir(imagesPath, { recursive: true });
  } catch (error) {
    console.error('Failed to create data directories:', error);
  }
  
  // Set settings path before any service initialization
  setSettingsPath(settingsPath);
  
  // Initialize database
  db = new JsonDatabaseService(dbPath);
  await db.initialize();
  
  // Initialize sync service
  syncService = new SyncService(dbPath, settingsPath);
  
  // Load initial settings
  try {
    const settings = await getSettings();
    console.log('Initial settings loaded:', settings);
  } catch (error) {
    console.error('Failed to load initial settings:', error);
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Load initial settings before loading the window
  const settings = await getSettings();
  
  await mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  
  // Send settings to renderer after window is loaded
  mainWindow.webContents.send('settings-loaded', settings);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  await initializeServices();
  await createWindow();
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

// Data path IPC handlers
ipcMain.handle('get-data-path', async () => {
  return await configManager.getDataPath();
});

ipcMain.handle('change-data-path', async (event, newPath) => {
  try {
    const oldPath = await configManager.getDataPath();
    
    // Migrate data to new location
    await configManager.migrateData(oldPath, newPath);
    
    // Update config with new path
    await configManager.setDataPath(newPath);
    
    return true;
  } catch (error) {
    console.error('Failed to change data path:', error);
    throw error;
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
    const savedSettings = await saveSettings(settings);
    // Notify renderer of settings update
    mainWindow.webContents.send('settings-loaded', savedSettings);
    return savedSettings;
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

// Get user data path
ipcMain.handle('get-user-data-path', () => {
  console.log('[Main] Getting user data path');
  const userDataPath = app.getPath('userData');
  console.log('[Main] User data path:', userDataPath);
  console.log('[Main] Images directory:', path.join(userDataPath, 'data', 'images'));
  return userDataPath;
});

// Handle image uploads
ipcMain.handle('add-image', async (event, entryId, buffer, filename) => {
  console.log('[Main] Received image upload request:', {
    entryId,
    filename,
    bufferSize: buffer?.byteLength
  });

  try {
    // Create date-based directory structure
    const now = new Date();
    const dateDir = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const imagesPath = path.join(app.getPath('userData'), 'data', 'images', dateDir);
    console.log('[Main] Images directory path:', imagesPath);
    
    // Ensure directory exists
    await fs.mkdir(imagesPath, { recursive: true });
    console.log('[Main] Images directory created/verified');
    
    // Generate unique filename
    const ext = path.extname(filename);
    const timestamp = now.getTime();
    const uniqueFilename = `${timestamp}${ext}`;
    const filePath = path.join(imagesPath, uniqueFilename);
    console.log('[Main] Generated file path:', filePath);
    
    // Save the image
    await fs.writeFile(filePath, Buffer.from(buffer));
    console.log('[Main] Image file saved');
    
    // Return relative path for editor
    const relativePath = path.join('images', dateDir, uniqueFilename);
    console.log('[Main] Returning relative path:', relativePath);
    return { path: relativePath };
  } catch (error) {
    console.error('Failed to save image:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
});
