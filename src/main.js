import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getSettings, saveSettings } from './services/settings-service.js';
import JsonDatabaseService from './services/json-database.js';

let db;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow;

export function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: join(__dirname, 'preload.cjs')
    }
  });

  mainWindow.loadFile(join(__dirname, 'renderer', 'index.html'));
}

// IPC handlers
ipcMain.handle('get-settings', async () => {
  try {
    const settings = await getSettings();
    return settings;
  } catch (error) {
    console.error('Failed to get settings:', error);
    throw error;
  }
});

ipcMain.handle('update-settings', async (_, settings) => {
  try {
    const updatedSettings = await saveSettings(settings);
    // Notify renderer of settings update
    mainWindow?.webContents.send('settings-loaded', updatedSettings);
    return updatedSettings;
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
});

ipcMain.handle('get-entries', async () => {
  try {
    if (!db || !db.isInitialized()) {
      console.error('Database not initialized');
      return [];
    }
    const entries = await db.getEntries();
    console.log('Retrieved entries:', entries);
    return entries;
  } catch (error) {
    console.error('Failed to get entries:', error);
    return [];
  }
});

ipcMain.handle('add-entry', async (_, content) => {
  try {
    if (!db || !db.isInitialized()) {
      throw new Error('Database not initialized');
    }
    const id = await db.addEntry(content);
    console.log('Added entry:', id);
    return id;
  } catch (error) {
    console.error('Failed to add entry:', error);
    throw error;
  }
});

ipcMain.handle('update-entry', async (_, id, content) => {
  try {
    if (!db || !db.isInitialized()) {
      throw new Error('Database not initialized');
    }
    const updated = await db.updateEntry(id, content);
    console.log('Updated entry:', id);
    return updated;
  } catch (error) {
    console.error('Failed to update entry:', error);
    throw error;
  }
});

ipcMain.handle('delete-entry', async (_, id) => {
  try {
    if (!db || !db.isInitialized()) {
      throw new Error('Database not initialized');
    }
    await db.deleteEntry(id);
    console.log('Deleted entry:', id);
    return true;
  } catch (error) {
    console.error('Failed to delete entry:', error);
    throw error;
  }
});

ipcMain.handle('add-image', async (_, entryId, buffer, filename) => {
  try {
    if (!db || !db.isInitialized()) {
      throw new Error('Database not initialized');
    }
    const imageInfo = await db.addImage(entryId, buffer, filename);
    console.log('Added image:', imageInfo);
    return imageInfo;
  } catch (error) {
    console.error('Failed to add image:', error);
    throw error;
  }
});

ipcMain.handle('create-backup', async () => {
  // TODO: Implement backup creation
  return true;
});

ipcMain.handle('restore-backup', async () => {
  // TODO: Implement backup restoration
  return true;
});

ipcMain.handle('sync-data', async (_, provider) => {
  // TODO: Implement data sync
  return true;
});

// App lifecycle events
app.whenReady().then(async () => {
  try {
    // Initialize database
    db = new JsonDatabaseService(join(app.getPath('userData'), 'pim.db'));
    await db.initialize();
    console.log('Database initialized');
    
    createWindow();
    
    // Load initial settings
    const settings = await getSettings();
    mainWindow?.webContents.send('settings-loaded', settings);
  } catch (error) {
    console.error('Failed to initialize:', error);
  }
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
