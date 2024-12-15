class ConfigManager {
  #storage;
  #config;
  #defaults;

  constructor(storage) {
    this.#storage = storage;
    this.#defaults = {
      parser: {
        maxDepth: 3,
        ignoreFiles: [],
        outputFormat: 'json',
        tellTruth: true
      },
      reminders: {
        defaultMinutes: 15,
        allowMultiple: true
      },
      ui: {
        theme: 'light',
        fontSize: 14,
        showToolbar: true
      }
    };
  }

  async initialize() {
    try {
      const stored = await this.#storage.load();
      this.#config = this.#mergeWithDefaults(stored);
    } catch (error) {
      console.error('Failed to load config:', error);
      this.#config = { ...this.#defaults };
    }
  }

  #mergeWithDefaults(stored) {
    const merged = { ...this.#defaults };
    
    for (const [key, value] of Object.entries(stored)) {
      if (typeof value === 'object' && value !== null) {
        merged[key] = { ...merged[key], ...value };
      } else {
        merged[key] = value;
      }
    }
    
    return merged;
  }

  async save() {
    await this.#storage.save(this.#config);
  }

  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.#config);
  }

  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key], this.#config);
    target[lastKey] = value;
  }

  async getAll() {
    return this.#config;
  }

  async update(newSettings) {
    this.#config = this.#mergeWithDefaults(newSettings);
    await this.save();
    return this.#config;
  }
}

class DatabaseConfigStorage {
  #db;
  
  constructor(db) {
    this.#db = db;
  }
  
  async load() {
    const settings = await this.#db.getSetting('config');
    return settings ? JSON.parse(settings.value) : {};
  }
  
  async save(config) {
    await this.#db.setSetting('config', JSON.stringify(config));
  }
}

module.exports = { ConfigManager, DatabaseConfigStorage }; 
