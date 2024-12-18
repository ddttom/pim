const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const JsonDatabaseService = require('./services/json-database');
const ConfigManager = require('./config/ConfigManager');
const logger = require('./services/logger');
const EntryService = require('./services/entry-service');
const SettingsService = require('./services/settings-service');

class MainProcess {
  #db;
  #config;
  #parser;
  #mainWindow;
  #entryService;
  #settings;
  #isInitialized = false;

  constructor() {
    this.#initializeApp();
  }

  #initializeApp() {
    app.whenReady().then(async () => {
      try {
        await this.#initializeServices();
        this.#setupIpcHandlers();
        this.#createWindow();
        this.#isInitialized = true;
        
        app.on('activate', () => {
          if (BrowserWindow.getAllWindows().length === 0) {
            this.#createWindow();
          }
        });
      } catch (error) {
        logger.error('Failed to initialize application:', error);
        app.exit(1);
      }
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('before-quit', async (event) => {
      event.preventDefault();
      await this.#cleanup();
      app.exit(0);
    });
  }

  #setupIpcHandlers() {
    // Entry-related handlers
    ipcMain.handle('add-entry', this.#handleAddEntry.bind(this));
    ipcMain.handle('get-entries', this.#handleGetEntries.bind(this));
    ipcMain.handle('delete-entry', this.#handleDeleteEntry.bind(this));
    ipcMain.handle('add-image', this.#handleAddImage.bind(this));

    // Parser-related handlers
    ipcMain.handle('parse-text', this.#handleParseText.bind(this));

    // Settings-related handlers
    ipcMain.handle('get-settings', this.#handleGetSettings.bind(this));
    ipcMain.handle('update-settings', this.#handleUpdateSettings.bind(this));
  }

  async #handleAddEntry(event, content) {
    try {
      logger.info('Received add-entry request with content:', content);
      const entryId = await this.#entryService.addEntry(content);
      logger.info('Entry added successfully with ID:', entryId);
      return entryId;
    } catch (error) {
      logger.error('Failed to add entry', error);
      throw error;
    }
  }

  async #handleGetEntries(event, filters = {}) {
    try {
      return await this.#db.getEntries(filters);
    } catch (error) {
      logger.error('Failed to get entries', error);
      throw error;
    }
  }

  async #handleDeleteEntry(event, id) {
    try {
      const result = await this.#db.deleteEntry(id);
      if (!result) {
        throw new Error(`Entry with id ${id} not found`);
      }
      return result;
    } catch (error) {
      logger.error('Failed to delete entry', error);
      throw error;
    }
  }

  async #handleAddImage(event, entryId, buffer, filename) {
    try {
      return await this.#db.addImage(entryId, Buffer.from(buffer), filename);
    } catch (error) {
      logger.error('Failed to add image', error);
      throw error;
    }
  }

  #handleParseText(event, text) {
    try {
      return this.#parser.parse(text);
    } catch (error) {
      logger.error('Failed to parse text', error);
      throw error;
    }
  }

  async #handleGetSettings() {
    try {
      return await this.#config.getAll();
    } catch (error) {
      logger.error('Failed to get settings', error);
      throw error;
    }
  }

  async #handleUpdateSettings(event, settings) {
    try {
      await this.#config.update(settings);
      return true;
    } catch (error) {
      logger.error('Failed to update settings', error);
      throw error;
    }
  }

  async #initializeServices() {
    try {
      const userDataPath = app.getPath('userData');
      
      // Initialize settings service first
      this.#settings = new SettingsService(userDataPath);
      await this.#settings.initialize();

      // Initialize config with settings service
      this.#config = new ConfigManager(this.#settings);
      await this.#config.initialize();

      // Initialize database for entries
      const dbPath = path.join(userDataPath, 'pim.json');
      this.#db = new JsonDatabaseService();
      await this.#db.initialize(dbPath);

      // Initialize parser
      const Parser = require('./services/parser');
      this.#parser = new Parser(logger);

      // Initialize entry service
      this.#entryService = new EntryService(this.#db, this.#parser);
      
      logger.info('All services initialized successfully');
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

    this.#mainWindow.on('close', this.#handleWindowClose.bind(this));
    this.#mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    if (process.env.NODE_ENV === 'development') {
      this.#mainWindow.webContents.openDevTools();
    }
  }

  async #handleWindowClose(event) {
    if (process.platform === 'darwin') {
      event.preventDefault();
      this.#mainWindow.hide();
      return;
    }
    
    event.preventDefault();
    await this.#cleanup();
    app.quit();
  }

  async #cleanup() {
    if (!this.#isInitialized) return;

    try {
      // Save all pending changes
      if (this.#config) {
        await this.#config.backup();
      }

      // Close database connections
      if (this.#db?.isInitialized()) {
        await this.#db.close();
      }

      // Clean up services
      if (this.#entryService) {
        await this.#entryService.cleanup();
      }

      this.#isInitialized = false;
      logger.info('Application cleanup completed successfully');
    } catch (error) {
      logger.error('Error during cleanup:', error);
      throw error;
    }
  }

  isInitialized() {
    return this.#isInitialized;
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
