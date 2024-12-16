const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

class JsonDatabaseService {
  #dbPath;
  #data;
  #autoSave = true;

  constructor() {
    this.#data = {
      entries: [],
      settings: {},
      meta: {
        version: '1.0.0',
        last_backup: new Date().toISOString()
      }
    };
  }

  async initialize(dbPath) {
    this.#dbPath = dbPath;
    try {
      const exists = await fs.access(dbPath).then(() => true).catch(() => false);
      if (exists) {
        const content = await fs.readFile(dbPath, 'utf8');
        this.#data = JSON.parse(content);
        logger.info('JSON database loaded successfully');
      } else {
        // Create directory if it doesn't exist
        await fs.mkdir(path.dirname(dbPath), { recursive: true });
        await this.save();
        logger.info('New JSON database created successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize JSON database:', error);
      throw new Error(`Failed to initialize database: ${error.message}`);
    }
  }

  async save() {
    try {
      await fs.writeFile(
        this.#dbPath,
        JSON.stringify(this.#data, null, 2),
        'utf8'
      );
      logger.debug('Database saved successfully');
    } catch (error) {
      logger.error('Failed to save database:', error);
      throw new Error(`Failed to save database: ${error.message}`);
    }
  }

  // Entry operations
  async addEntry(parserOutput) {
    const now = new Date().toISOString();
    
    // Create entry by adding only database-specific fields to parser output
    const newEntry = {
      id: uuidv4(),
      created_at: now,
      updated_at: now,
      ...parserOutput // Keep exact parser output structure
    };

    this.#data.entries.push(newEntry);
    if (this.#autoSave) await this.save();
    return newEntry.id;
  }

  async getEntries(filters = {}) {
    let entries = [...this.#data.entries];

    if (filters.status?.size) {
      entries = entries.filter(e => filters.status.has(e.parsed?.status));
    }

    if (filters.date?.size) {
      entries = entries.filter(e => {
        const date = new Date(e.parsed?.final_deadline).toISOString().split('T')[0];
        return filters.date.has(date);
      });
    }

    if (filters.categories?.size) {
      entries = entries.filter(e => 
        e.parsed?.categories?.some(c => filters.categories.has(c))
      );
    }

    if (filters.sort) {
      const { column, direction } = filters.sort;
      entries.sort((a, b) => {
        let aVal, bVal;

        // Handle nested paths in parsed data
        if (column.includes('.')) {
          const [parent, child] = column.split('.');
          aVal = parent === 'parsed' ? a.parsed?.[child] : a[parent]?.[child];
          bVal = parent === 'parsed' ? b.parsed?.[child] : b[parent]?.[child];
        } else {
          aVal = a[column];
          bVal = b[column];
        }
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        return direction === 'DESC' ? 
          String(bVal).localeCompare(String(aVal)) : 
          String(aVal).localeCompare(String(bVal));
      });
    }

    return entries;
  }

  async getEntry(id) {
    return this.#data.entries.find(e => e.id === id);
  }

  async updateEntry(id, updates) {
    const index = this.#data.entries.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error(`Entry with id ${id} not found`);
    }

    const entry = this.#data.entries[index];
    const updated = {
      ...entry,
      ...updates, // Keep parser output structure
      id: entry.id, // Ensure id doesn't get overwritten
      updated_at: new Date().toISOString(),
      created_at: entry.created_at // Preserve original creation time
    };

    this.#data.entries[index] = updated;
    if (this.#autoSave) await this.save();
    return updated;
  }

  async deleteEntry(id) {
    const initialLength = this.#data.entries.length;
    this.#data.entries = this.#data.entries.filter(e => e.id !== id);
    if (this.#autoSave) await this.save();
    return initialLength > this.#data.entries.length;
  }

  // Settings operations
  async getSetting(key) {
    return this.#data.settings[key];
  }

  async setSetting(key, value) {
    this.#data.settings[key] = value;
    if (this.#autoSave) await this.save();
  }

  async getSettings() {
    return { ...this.#data.settings };
  }

  // Backup/Restore
  async backup(backupPath) {
    await fs.copyFile(this.#dbPath, backupPath);
    this.#data.meta.last_backup = new Date().toISOString();
    if (this.#autoSave) await this.save();
  }

  async restore(backupPath) {
    const content = await fs.readFile(backupPath, 'utf8');
    this.#data = JSON.parse(content);
    if (this.#autoSave) await this.save();
  }

  // Transaction-like operations
  async batch(operations) {
    this.#autoSave = false;
    try {
      for (const op of operations) {
        await op();
      }
      this.#autoSave = true;
      await this.save();
    } catch (error) {
      this.#autoSave = true;
      throw error;
    }
  }

  isInitialized() {
    return !!this.#dbPath;
  }

  async close() {
    await this.save();
  }
}

module.exports = JsonDatabaseService;
