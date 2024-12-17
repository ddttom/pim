const fs = require('fs').promises;
const path = require('path');

class ConfigError extends Error {
  constructor(message, category, details = {}) {
    super(message);
    this.name = 'ConfigError';
    this.category = category;
    this.details = details;
  }
}

// Manages all configuration/settings with validation and defaults
class ConfigManager {
  constructor(settingsService, configPath = null) {
    this.settings = settingsService;
    this.currentConfig = null;
    this.configPath = configPath; // Allow injection of config path for testing
    this.logger = {
      debug: (msg) => {
        if (process.env.DEBUG && process.env.NODE_ENV !== 'test') {
          console.log(msg);
        }
      },
      info: (msg) => {
        if (process.env.NODE_ENV !== 'test') {
          console.log(msg);
        }
      },
      warn: (msg) => {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(msg);
        }
      },
      error: (msg, err) => {
        if (process.env.NODE_ENV === 'test') {
          // In test environment, only log critical errors
          if (err && err.critical) console.error(msg, err);
        } else {
          console.error(msg, err);
        }
      }
    };
    
    // Define default configuration
    this.defaults = {
      parser: {
        maxDepth: 3,
        ignoreFiles: ['.git', 'node_modules'],
        outputFormat: 'json',
        tellTruth: true
      },
      reminders: {
        defaultMinutes: 15,
        allowMultiple: true
      }
    };

    // Define validation schema
    this.schema = {
      parser: {
        maxDepth: (value) => typeof value === 'number' && value > 0,
        ignoreFiles: (value) => Array.isArray(value),
        outputFormat: (value) => ['json', 'text'].includes(value),
        tellTruth: (value) => typeof value === 'boolean'
      },
      reminders: {
        defaultMinutes: (value) => typeof value === 'number' && value > 0,
        allowMultiple: (value) => typeof value === 'boolean'
      }
    };

    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    return () => {
      this.listeners.get(event).delete(callback);
    };
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        callback(data);
      });
    }
  }

  async initialize() {
    try {
      // 1. Load config.json if it exists
      const fileConfig = await this.loadConfigFile();
      
      // 2. Load saved settings from database
      const savedSettings = await this.settings.getAllSettings();
      
      // 3. Merge with defaults (file config takes precedence over defaults)
      const mergedDefaults = this.mergeWithDefaults(fileConfig);
      
      // 4. Merge with database settings (database takes precedence)
      this.currentConfig = this.mergeWithDefaults(savedSettings, mergedDefaults);
      
      // 5. Apply environment variables (highest priority)
      this.applyEnvironmentVariables();
      
      // 6. Validate the final config
      this.validateConfig(this.currentConfig);
      
      return this.currentConfig;
    } catch (error) {
      this.logger.error('Failed to initialize config:', error);
      // Fallback to defaults on error
      this.currentConfig = { ...this.defaults };
      // Still apply environment variables even in fallback
      this.applyEnvironmentVariables();
      return this.currentConfig;
    }
  }

  async loadConfigFile() {
    try {
      // Gets user data path from Electron
      const { app } = require('electron');
      configPath = path.join(app.getPath('userData'), 'config.json');
      
      this.logger.info('Looking for config at:', configPath);
      
      const fileData = await fs.readFile(configPath, 'utf8');
      const fileConfig = JSON.parse(fileData);
      
      return fileConfig;
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.info('No config.json found');
      } else {
        this.logger.error('Error loading config.json:', error);
      }
      return {};
    }
  }

  mergeWithDefaults(settings, baseDefaults = this.defaults) {
    const merged = { ...baseDefaults };
    
    // Deep merge settings with defaults
    for (const [category, values] of Object.entries(settings)) {
      if (merged[category]) {
        merged[category] = { ...merged[category], ...values };
      }
    }
    
    return merged;
  }

  validateConfig(config) {
    for (const [category, schema] of Object.entries(this.schema)) {
      if (!config[category]) {
        throw new ConfigError(
          `Missing required category: ${category}`,
          category
        );
      }

      for (const [key, validator] of Object.entries(schema)) {
        if (!validator(config[category][key])) {
          throw new ConfigError(
            `Invalid config value for ${category}.${key}`,
            category,
            { key, value: config[category][key] }
          );
        }
      }
    }
  }

  async updateSettings(category, settings) {
    // 1. Validate settings first
    await this.validateConfig({ [category]: settings });
    
    // 2. Save to settings.json
    await this.settings.saveSetting(category, settings);
    
    // 3. Update in-memory config
    this.currentConfig[category] = {
      ...this.currentConfig[category],
      ...settings
    };
  }

  get(category, key) {
    // Check if config is initialized
    if (!this.currentConfig) {
      throw new Error('Config not initialized');
    }
    
    // Return specific key or entire category
    if (key) {
      return this.currentConfig[category]?.[key];
    }
    return this.currentConfig[category];
  }

  applyEnvironmentVariables() {
    const envVars = Object.keys(process.env)
      .filter(key => key.startsWith('pim.'));

    for (const key of envVars) {
      const parts = key.split('.');
      if (parts.length !== 3) continue;

      const [prefix, category, setting] = parts;
      if (!this.currentConfig[category]) continue;

      let value = process.env[key];
      let parsedValue;
      
      try {
        if (this.schema[category]?.[setting]) {
          // Convert value based on type
          if (typeof this.currentConfig[category][setting] === 'boolean') {
            parsedValue = value.toLowerCase() === 'true';
          } else if (typeof this.currentConfig[category][setting] === 'number') {
            parsedValue = Number(value);
            if (isNaN(parsedValue)) {
              this.logger.debug(`Invalid number value for ${key}: ${value}`);
              continue;
            }
          } else if (Array.isArray(this.currentConfig[category][setting])) {
            try {
              parsedValue = JSON.parse(value);
              if (!Array.isArray(parsedValue)) {
                this.logger.debug(`Invalid array value for ${key}: ${value}`);
                continue;
              }
            } catch (e) {
              this.logger.debug(`Invalid array format for ${key}: ${value}`);
              continue;
            }
          } else {
            parsedValue = value;
          }

          // Validate the parsed value
          if (this.schema[category][setting](parsedValue)) {
            this.currentConfig[category][setting] = parsedValue;
            this.logger.debug(`Environment override: ${key}=${value}`);
          } else {
            this.logger.debug(`Invalid value for ${key}: ${value}`);
          }
        }
      } catch (error) {
        this.logger.debug(`Failed to apply environment variable ${key}:`, error);
      }
    }
  }

  async backup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(
        path.dirname(this.configPath),
        `backups/config-${timestamp}.json`
      );
      
      await fs.mkdir(path.dirname(backupPath), { recursive: true });
      await fs.writeFile(
        backupPath,
        JSON.stringify(this.currentConfig, null, 2)
      );
      
      this.emit('backupCreated', backupPath);
      return backupPath;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async restore(backupPath) {
    try {
      const backupConfig = JSON.parse(
        await fs.readFile(backupPath, 'utf8')
      );
      
      // Validate backup config
      this.validateConfig(backupConfig);
      
      // Save to database
      await this.settings.saveAllSettings(backupConfig);
      
      // Update current config
      this.currentConfig = backupConfig;
      
      this.emit('configRestored', this.currentConfig);
      return this.currentConfig;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
}

module.exports = ConfigManager; 
