const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('./services/json-database');
const Parser = require('./services/parser');
const EntryService = require('./services/entry-service');
const SettingsService = require('./services/settings-service');
const logger = require('./services/logger');

let mainWindow;
let database;
let parser;
let entryService;
let settingsService;

async function initializeServices() {
  try {
    const userDataPath = app.getPath('userData');

    // Initialize settings first
    settingsService = new SettingsService(userDataPath);
    await settingsService.load();
    logger.info('Settings loaded successfully');

    // Initialize database with proper path
    const dbPath = path.join(userDataPath, 'database.json');
    database = new Database(dbPath);
    await database.initialize();
    logger.info('JSON database loaded successfully');

    parser = new Parser(logger);
    entryService = new EntryService(database, parser);

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    throw error;
  }
}

async function createWindow() {
  try {
    await initializeServices();

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    await mainWindow.loadFile('src/renderer/index.html');

    // Send settings to renderer after window loads
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('settings-loaded', settingsService.get());
    });
  } catch (error) {
    logger.error('Failed to create window:', error);
    app.quit();
  }
}

// App event handlers
app.whenReady().then(createWindow);

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

// IPC handlers
ipcMain.handle('get-settings', () => settingsService.get());
ipcMain.handle('update-settings', async (_, updates) => {
  try {
    const updated = await settingsService.update(updates);
    mainWindow.webContents.send('settings-loaded', updated);
    return updated;
  } catch (error) {
    logger.error('Failed to update settings:', error);
    throw error;
  }
});

ipcMain.handle('add-entry', async (_, content) => {
  try {
    logger.info('Received add-entry request with content:', content);
    return await entryService.addEntry(content);
  } catch (error) {
    logger.error('Failed to add entry:', error);
    throw error;
  }
});

ipcMain.handle('update-entry', async (_, id, updates) => {
  try {
    return await entryService.updateEntry(id, updates);
  } catch (error) {
    logger.error('Failed to update entry:', error);
    throw error;
  }
});

ipcMain.handle('get-entries', async () => {
  try {
    return await entryService.getEntries();
  } catch (error) {
    logger.error('Failed to get entries:', error);
    throw error;
  }
});

ipcMain.handle('get-entry', async (_, id) => {
  try {
    return await entryService.getEntry(id);
  } catch (error) {
    logger.error('Failed to get entry:', error);
    throw error;
  }
});

ipcMain.handle('delete-entry', async (_, id) => {
  try {
    return await entryService.deleteEntry(id);
  } catch (error) {
    logger.error('Failed to delete entry:', error);
    throw error;
  }
});
