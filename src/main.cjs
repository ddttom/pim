const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { JsonDatabaseService } = require('./services/json-database.cjs');
const { SettingsService } = require('./services/settings-service.cjs');
const { ParserService } = require('./services/parser.cjs');
const { UI, IpcChannels, ErrorMessages } = require('./constants.js');

// Services
const db = new JsonDatabaseService();
const settings = new SettingsService();
const parser = new ParserService();

let mainWindow = null;

async function createWindow() {
    mainWindow = new BrowserWindow({
        width: UI.Window.DEFAULT_WIDTH,
        height: UI.Window.DEFAULT_HEIGHT,
        minWidth: UI.Window.MIN_WIDTH,
        minHeight: UI.Window.MIN_HEIGHT,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });

    await mainWindow.loadFile('src/index.html');
}

// IPC Handlers
ipcMain.handle(IpcChannels.GET_SETTINGS, async () => {
    try {
        return await settings.getSettings();
    } catch (error) {
        console.error('Error getting settings:', error);
        mainWindow.webContents.send('error', {
            message: ErrorMessages.SETTINGS_LOAD,
            error: error.message
        });
        throw error;
    }
});

ipcMain.handle(IpcChannels.SAVE_SETTINGS, async (_event, newSettings) => {
    try {
        await settings.saveSettings(newSettings);
        mainWindow.webContents.send('settings-changed', newSettings);
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        mainWindow.webContents.send('error', {
            message: ErrorMessages.SETTINGS_SAVE,
            error: error.message
        });
        throw error;
    }
});

ipcMain.handle(IpcChannels.GET_ENTRIES, async () => {
    try {
        return await db.getAllEntries();
    } catch (error) {
        console.error('Error getting entries:', error);
        mainWindow.webContents.send('error', {
            message: ErrorMessages.DB_CONNECTION,
            error: error.message
        });
        throw error;
    }
});

ipcMain.handle(IpcChannels.SAVE_ENTRY, async (_event, entry) => {
    try {
        const savedEntry = await db.saveEntry(entry);
        const entries = await db.getAllEntries();
        mainWindow.webContents.send('entries-changed', entries);
        return savedEntry;
    } catch (error) {
        console.error('Error saving entry:', error);
        mainWindow.webContents.send('error', {
            message: ErrorMessages.SAVE_FAILED,
            error: error.message
        });
        throw error;
    }
});

ipcMain.handle(IpcChannels.DELETE_ENTRY, async (_event, entryId) => {
    try {
        await db.deleteEntry(entryId);
        const entries = await db.getAllEntries();
        mainWindow.webContents.send('entries-changed', entries);
        return true;
    } catch (error) {
        console.error('Error deleting entry:', error);
        mainWindow.webContents.send('error', {
            message: ErrorMessages.ENTRY_NOT_FOUND(entryId),
            error: error.message
        });
        throw error;
    }
});

ipcMain.handle(IpcChannels.PARSE_TEXT, async (_event, text) => {
    try {
        return await parser.parse(text);
    } catch (error) {
        console.error('Error parsing text:', error);
        mainWindow.webContents.send('error', {
            message: 'Failed to parse text',
            error: error.message
        });
        throw error;
    }
});

ipcMain.handle(IpcChannels.GET_THEME, async () => {
    try {
        const userSettings = await settings.getSettings();
        return userSettings.theme || UI.Themes.LIGHT;
    } catch (error) {
        console.error('Error getting theme:', error);
        mainWindow.webContents.send('error', {
            message: 'Failed to get theme',
            error: error.message
        });
        throw error;
    }
});

ipcMain.handle(IpcChannels.SET_THEME, async (_event, theme) => {
    try {
        const userSettings = await settings.getSettings();
        await settings.saveSettings({
            ...userSettings,
            theme
        });
        mainWindow.webContents.send('theme-changed', theme);
        return true;
    } catch (error) {
        console.error('Error setting theme:', error);
        mainWindow.webContents.send('error', {
            message: 'Failed to set theme',
            error: error.message
        });
        throw error;
    }
});

ipcMain.handle(IpcChannels.SYNC_ENTRIES, async (_event, entries) => {
    try {
        await db.syncEntries(entries);
        mainWindow.webContents.send('entries-changed', entries);
        return true;
    } catch (error) {
        console.error('Error syncing entries:', error);
        mainWindow.webContents.send('error', {
            message: 'Failed to sync entries',
            error: error.message
        });
        throw error;
    }
});

// App lifecycle
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

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    if (mainWindow) {
        mainWindow.webContents.send('error', {
            message: 'An unexpected error occurred',
            error: error.message
        });
    }
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    if (mainWindow) {
        mainWindow.webContents.send('error', {
            message: 'An unexpected error occurred',
            error: error.message
        });
    }
});
