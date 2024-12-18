import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getSettings, saveSettings } from './services/settings-service.js';

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
  // TODO: Implement entries retrieval
  return [];
});

ipcMain.handle('add-entry', async (_, content) => {
  // TODO: Implement entry creation
  return 'new-entry-id';
});

ipcMain.handle('update-entry', async (_, id, content) => {
  // TODO: Implement entry update
  return true;
});

ipcMain.handle('delete-entry', async (_, id) => {
  // TODO: Implement entry deletion
  return true;
});

ipcMain.handle('add-image', async (_, entryId, buffer, filename) => {
  // TODO: Implement image addition
  return { path: 'image-path' };
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
  createWindow();
  
  // Load initial settings
  try {
    const settings = await getSettings();
    mainWindow?.webContents.send('settings-loaded', settings);
  } catch (error) {
    console.error('Failed to load initial settings:', error);
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
