const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const DatabaseService = require('./services/database');

let db = null;
let mainWindow = null;

// Initialize database when app is ready
app.whenReady().then(async () => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'pim.db');
    db = new DatabaseService(dbPath);
    await db.initialize();
    createWindow();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    await dialog.showMessageBox({
      type: 'error',
      title: 'Initialization Error',
      message: 'Failed to initialize settings',
      detail: error.message,
      buttons: ['OK']
    });
    app.quit();
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'PIM',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Create menu template
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Entry',
          accelerator: process.platform === 'darwin' ? 'Cmd+N' : 'Ctrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-entry');
          }
        },
        { type: 'separator' },
        {
          label: 'Import from CSV',
          accelerator: process.platform === 'darwin' ? 'Cmd+I' : 'Ctrl+I',
          click: async () => {
            const { filePaths } = await dialog.showOpenDialog(mainWindow, {
              title: 'Import Database',
              filters: [
                { name: 'CSV Files', extensions: ['csv'] }
              ],
              properties: ['openFile']
            });

            if (filePaths && filePaths[0]) {
              mainWindow.webContents.send('import-db', filePaths[0]);
            }
          }
        },
        {
          label: 'Export to CSV',
          accelerator: process.platform === 'darwin' ? 'Cmd+E' : 'Ctrl+E',
          click: async () => {
            const { filePath } = await dialog.showSaveDialog(mainWindow, {
              title: 'Export Database',
              defaultPath: 'pim-export.csv',
              filters: [
                { name: 'CSV Files', extensions: ['csv'] }
              ]
            });

            if (filePath) {
              mainWindow.webContents.send('export-db', filePath);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit and Delete Database',
          accelerator: process.platform === 'darwin' ? 'Cmd+Shift+Q' : 'Ctrl+Shift+Q',
          click: async () => {
            const { response } = await dialog.showMessageBox(mainWindow, {
              type: 'warning',
              title: 'Quit and Delete Database',
              message: 'Are you sure you want to quit and delete the database?',
              detail: 'This will permanently delete all entries and settings. This action cannot be undone.',
              buttons: ['Cancel', 'Quit and Delete'],
              defaultId: 0,
              cancelId: 0
            });

            if (response === 1) {
              try {
                await deletePimDb();
                app.quit();
              } catch (error) {
                await dialog.showMessageBox(mainWindow, {
                  type: 'error',
                  title: 'Error',
                  message: 'Failed to delete database',
                  detail: error.message
                });
              }
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Table View',
          accelerator: process.platform === 'darwin' ? 'Cmd+1' : 'Ctrl+1',
          click: () => {
            mainWindow.webContents.send('menu-view-table');
          }
        },
        {
          label: 'Card View',
          accelerator: process.platform === 'darwin' ? 'Cmd+2' : 'Ctrl+2',
          click: () => {
            mainWindow.webContents.send('menu-view-cards');
          }
        },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { role: 'reload' }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'Parser Configuration',
          accelerator: process.platform === 'darwin' ? 'Cmd+,' : 'Ctrl+,',
          click: () => {
            mainWindow.webContents.send('show-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Export Settings',
          click: async () => {
            const { filePath } = await dialog.showSaveDialog(mainWindow, {
              title: 'Export Settings',
              defaultPath: 'pim-settings.json',
              filters: [
                { name: 'JSON Files', extensions: ['json'] }
              ]
            });

            if (filePath) {
              mainWindow.webContents.send('export-settings', filePath);
            }
          }
        },
        {
          label: 'Import Settings',
          click: async () => {
            const { filePaths } = await dialog.showOpenDialog(mainWindow, {
              title: 'Import Settings',
              filters: [
                { name: 'JSON Files', extensions: ['json'] }
              ],
              properties: ['openFile']
            });

            if (filePaths && filePaths[0]) {
              mainWindow.webContents.send('import-settings', filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Clear Database',
          click: async () => {
            const { response } = await dialog.showMessageBox(mainWindow, {
              type: 'warning',
              title: 'Clear Database',
              message: 'Are you sure you want to clear the database?',
              detail: 'This will permanently delete all entries and settings. This action cannot be undone.',
              buttons: ['Cancel', 'Clear Database'],
              defaultId: 0,
              cancelId: 0
            });

            if (response === 1) {
              mainWindow.webContents.send('clear-database');
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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

// Update the IPC handlers
ipcMain.handle('get-settings', async () => {
  try {
    if (!db.initialized) {
      await db.initialize();
    }
    const settings = await db.getAllSettings();
    return settings;
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
});

// Add this helper function at the top level
async function deletePimDb() {
  try {
    const dbPath = path.join(app.getPath('userData'), 'pim.db');
    if (fs.existsSync(dbPath)) {
      await fs.promises.unlink(dbPath);
      console.log('Successfully deleted pim.db');
    }
  } catch (error) {
    console.error('Error deleting pim.db:', error);
    throw error;
  }
}

// Add this IPC handler with the other handlers
ipcMain.handle('get-entries', async (event, filters) => {
  try {
    if (!db.initialized) {
      await db.initialize();
    }
    const entries = await db.getEntries(filters);
    return entries;
  } catch (error) {
    console.error('Error getting entries:', error);
    throw error;
  }
});
