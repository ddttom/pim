const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class SettingsService {
  constructor(userDataPath) {
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.settings = {};
  }

  async initialize() {
    try {
      const exists = await fs.access(this.settingsPath).then(() => true).catch(() => false);
      if (exists) {
        const content = await fs.readFile(this.settingsPath, 'utf8');
        this.settings = JSON.parse(content);
        logger.info('Settings loaded successfully');
      } else {
        await fs.mkdir(path.dirname(this.settingsPath), { recursive: true });
        await this.save();
        logger.info('New settings file created');
      }
    } catch (error) {
      logger.error('Failed to initialize settings:', error);
      throw error;
    }
  }

  async save() {
    try {
      await fs.writeFile(
        this.settingsPath,
        JSON.stringify(this.settings, null, 2),
        'utf8'
      );
      logger.debug('Settings saved successfully');
    } catch (error) {
      logger.error('Failed to save settings:', error);
      throw error;
    }
  }

  async getAllSettings() {
    return { ...this.settings };
  }

  async saveSetting(category, settings) {
    this.settings[category] = {
      ...this.settings[category],
      ...settings
    };
    await this.save();
  }

  async saveAllSettings(settings) {
    this.settings = settings;
    await this.save();
  }
}

module.exports = SettingsService; 
