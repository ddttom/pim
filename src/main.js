const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const DatabaseService = require('./services/database');
const { ConfigManager, DatabaseConfigStorage } = require('./services/config');
const Parser = require('./services/parser');
const logger = require('./services/logger');

class MainProcess {
  #db;
  #config;
  #parser;
  #mainWindow;

  constructor() {
    this.#initializeApp();
    this.#setupIpcHandlers();
  }

  #initializeApp() {
    app.whenReady().then(async () => {
      await this.#initializeServices();
      this.#createWindow();
      
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.#createWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  #setupIpcHandlers() {
    // Entry-related handlers
    ipcMain.handle('get-entries', async (event, filters = {}) => {
      try {
        return await this.#db.getEntries(filters);
      } catch (error) {
        logger.error('Failed to get entries', error);
        throw error;
      }
    });

    ipcMain.handle('add-entry', async (event, entry) => {
      try {
        return await this.#db.addEntry(entry);
      } catch (error) {
        logger.error('Failed to add entry', error);
        throw error;
      }
    });

    // Parser-related handlers
    ipcMain.handle('parse-text', async (event, text) => {
      try {
        return this.#parser.parse(text);
      } catch (error) {
        logger.error('Failed to parse text', error);
        throw error;
      }
    });

    // Settings-related handlers
    ipcMain.handle('get-settings', async () => {
      try {
        return await this.#config.getAll();
      } catch (error) {
        logger.error('Failed to get settings', error);
        throw error;
      }
    });

    ipcMain.handle('update-settings', async (event, settings) => {
      try {
        await this.#config.update(settings);
        return true;
      } catch (error) {
        logger.error('Failed to update settings', error);
        throw error;
      }
    });
  }

  async #initializeServices() {
    try {
      // Set up database path in user data directory
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'pim.db');

      // Initialize database
      this.#db = new DatabaseService();
      await this.#db.initialize(dbPath);

      // Initialize config
      const configStorage = new DatabaseConfigStorage(this.#db);
      this.#config = new ConfigManager(configStorage);
      await this.#config.initialize();

      // Initialize parser
      this.#parser = new Parser(logger);

    } catch (error) {
      logger.error('Failed to initialize services', error);
      throw error;
    }
  }

  #createWindow() {
    this.#mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    this.#mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    // Open DevTools in development
    if (process.env.NODE_ENV === 'development') {
      this.#mainWindow.webContents.openDevTools();
    }
  }

  getDatabase() {
    return this.#db;
  }

  getConfig() {
    return this.#config;
  }

  getParser() {
    return this.#parser;
  }
}

// Create and export a single instance
const mainProcess = new MainProcess();
module.exports = mainProcess;
