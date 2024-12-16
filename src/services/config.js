const logger = require('./logger');

class ConfigManager {
  #db;
  #config;

  constructor(database) {
    this.#db = database;
    this.#config = {
      parser: {
        timeDefaults: {
          morning: '09:00',
          afternoon: '14:00',
          evening: '18:00'
        },
        defaultStatus: 'None',
        defaultPriority: 'medium'
      },
      ui: {
        theme: 'light',
        density: 'comfortable',
        columns: ['action', 'project', 'final_deadline', 'status']
      }
    };
  }

  async initialize() {
    try {
      const savedConfig = await this.#db.getSetting('config');
      if (savedConfig) {
        this.#config = JSON.parse(savedConfig);
      } else {
        await this.save();
      }
      logger.info('Config initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize config:', error);
      throw error;
    }
  }

  async save() {
    try {
      await this.#db.setSetting('config', JSON.stringify(this.#config));
      logger.info('Config saved successfully');
    } catch (error) {
      logger.error('Failed to save config:', error);
      throw error;
    }
  }

  async update(updates) {
    try {
      this.#config = {
        ...this.#config,
        ...updates
      };
      await this.save();
      logger.info('Config updated successfully');
    } catch (error) {
      logger.error('Failed to update config:', error);
      throw error;
    }
  }

  async getAll() {
    return { ...this.#config };
  }

  async get(key) {
    return this.#config[key];
  }
}

module.exports = { ConfigManager };
