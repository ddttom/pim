const fs = require('fs').promises;
const path = require('path');

class SettingsService {
  #settingsPath;
  #settings;

  constructor(userDataPath) {
    this.#settingsPath = path.join(userDataPath, 'settings.json');
    this.#settings = null;
  }

  async load() {
    try {
      // Try to read existing settings
      const data = await fs.readFile(this.#settingsPath, 'utf8');
      this.#settings = JSON.parse(data);
    } catch (error) {
      // If file doesn't exist or is invalid, create default settings
      this.#settings = this.getDefaultSettings();
      await this.save();
    }
    return this.#settings;
  }

  async save() {
    try {
      await fs.writeFile(this.#settingsPath, JSON.stringify(this.#settings, null, 2));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  getDefaultSettings() {
    return {
      autosave: false,
      spellcheck: true,
      theme: {
        name: 'light',
        custom: {
          primary: '#3498db',
          secondary: '#95a5a6',
          background: '#f5f5f5',
          text: '#333333',
          accent: '#2ecc71'
        }
      },
      dateFormat: 'medium',
      shortcuts: {
        enabled: true,
        custom: {
          'newEntry': 'ctrl+n',
          'save': 'ctrl+s',
          'search': 'ctrl+f',
          'settings': 'ctrl+,',
          'bold': 'ctrl+b',
          'italic': 'ctrl+i',
          'underline': 'ctrl+u',
          'undo': 'ctrl+z',
          'redo': 'ctrl+shift+z',
          'backup': 'ctrl+shift+s',
          'escape': 'esc',
          'header1': 'alt+1',
          'header2': 'alt+2',
          'header3': 'alt+3',
          'sync': 'ctrl+shift+y',
          'toggleView': 'ctrl+\\',
          'filterEntries': 'ctrl+shift+f',
          'clearFilters': 'ctrl+shift+x',
          'nextEntry': 'alt+down',
          'prevEntry': 'alt+up',
          'duplicate': 'ctrl+d',
          'archive': 'ctrl+shift+a'
        }
      },
      notifications: true,
      autoBackup: {
        enabled: false,
        interval: 'daily'
      },
      sync: {
        enabled: false,
        provider: 'none',
        autoSync: false,
        syncInterval: 'hourly',
        lastSync: null
      },
      advanced: {
        fontSize: '16px',
        fontFamily: 'system-ui',
        borderRadius: '4px',
        spacing: 'comfortable',
        animations: true,
        customCSS: ''
      }
    };
  }

  get(key) {
    return key ? this.#settings[key] : this.#settings;
  }

  async update(updates) {
    this.#settings = {
      ...this.#settings,
      ...updates
    };
    await this.save();
    return this.#settings;
  }
}

module.exports = SettingsService; 
