const fs = require('fs').promises;
const path = require('path');

class JsonDatabaseService {
  #dbPath;
  #data;

  constructor(dbPath) {
    if (!dbPath) {
      throw new Error('Database path is required');
    }
    this.#dbPath = dbPath;
    this.#data = {
      entries: [],
      images: {},
      metadata: {
        version: '1.0',
        lastBackup: null
      }
    };
  }

  async initialize() {
    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.#dbPath), { recursive: true });

      // Try to read existing database
      try {
        const data = await fs.readFile(this.#dbPath, 'utf8');
        this.#data = JSON.parse(data);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
        // If file doesn't exist, create it with default data
        await this.save();
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async save() {
    try {
      await fs.writeFile(this.#dbPath, JSON.stringify(this.#data, null, 2));
    } catch (error) {
      console.error('Failed to save database:', error);
      throw error;
    }
  }

  async addEntry(entry) {
    try {
      const id = Date.now().toString();
      this.#data.entries.push({ id, ...entry });
      await this.save();
      return id;
    } catch (error) {
      console.error('Failed to add entry:', error);
      throw error;
    }
  }

  async updateEntry(id, updates) {
    try {
      const index = this.#data.entries.findIndex(e => e.id === id);
      if (index === -1) {
        throw new Error(`Entry with id ${id} not found`);
      }
      this.#data.entries[index] = { ...this.#data.entries[index], ...updates };
      await this.save();
      return this.#data.entries[index];
    } catch (error) {
      console.error('Failed to update entry:', error);
      throw error;
    }
  }

  async getEntry(id) {
    const entry = this.#data.entries.find(e => e.id === id);
    if (!entry) {
      throw new Error(`Entry with id ${id} not found`);
    }
    return entry;
  }

  async getEntries(filters = {}) {
    return this.#data.entries;
  }

  async deleteEntry(id) {
    try {
      const index = this.#data.entries.findIndex(e => e.id === id);
      if (index === -1) {
        throw new Error(`Entry with id ${id} not found`);
      }
      this.#data.entries.splice(index, 1);
      await this.save();
      return true;
    } catch (error) {
      console.error('Failed to delete entry:', error);
      throw error;
    }
  }
}

module.exports = JsonDatabaseService;
