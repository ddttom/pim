export default class ConfigManager {
  constructor(settingsService) {
    this.settingsService = settingsService;
    this.settings = this.getDefaults();
    this.listeners = new Set();
  }

  async load() {
    let userSettings = await this.settingsService.getAllSettings() || {};
    
    // Apply environment variables
    if (process.env.THEME) {
      userSettings.theme = process.env.THEME;
    }
    if (process.env.FONT_SIZE) {
      userSettings.fontSize = parseInt(process.env.FONT_SIZE, 10);
    }
    if (process.env.PLUGINS) {
      userSettings.plugins = process.env.PLUGINS.split(',');
    }

    this.settings = { ...this.settings, ...userSettings };
    this.validateSettings();
  }

  getDefaults() {
    return {
      theme: 'light',
      fontSize: 14,
      plugins: []
    };
  }

  validateSettings() {
    if (typeof this.settings.fontSize !== 'number') {
      throw new Error('Invalid font size');
    }
  }

  async updateSetting(key, value) {
    this.settings[key] = value;
    await this.settingsService.saveSetting(key, value);
    this.emitChange(key, value);
  }

  on(event, callback) {
    if (event === 'change') {
      this.listeners.add(callback);
    }
  }

  emitChange(key, value) {
    for (const listener of this.listeners) {
      listener(key, value);
    }
  }

  async createBackup() {
    return JSON.stringify(this.settings);
  }

  async restoreBackup(backup) {
    const settings = JSON.parse(backup);
    await this.settingsService.saveAllSettings(settings);
    this.settings = settings;
  }
}
