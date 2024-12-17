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
    
    // Create entry by adding database-specific fields to parser output
    const newEntry = {
      id: uuidv4(),
      content: parserOutput.raw_content,
      created_at: now,
      updated_at: now,
      parsed: parserOutput.parsed
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

    if (filters.categories?.size) {
      entries = entries.filter(e => 
        e.parsed?.category && filters.categories.has(e.parsed.category)
      );
    }

    if (filters.participants?.size) {
      entries = entries.filter(e => 
        e.parsed?.participants?.some(p => filters.participants.has(p))
      );
    }

    if (filters.sort) {
      const { column, direction } = filters.sort;
      entries.sort((a, b) => {
        let aVal = column.split('.').reduce((obj, key) => obj?.[key], a);
        let bVal = column.split('.').reduce((obj, key) => obj?.[key], b);
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        // For priority, use custom ordering
        if (column === 'parsed.priority') {
          const priorityOrder = { high: 2, medium: 1, low: 0 };
          return direction === 'DESC' 
            ? priorityOrder[bVal] - priorityOrder[aVal]
            : priorityOrder[aVal] - priorityOrder[bVal];
        }
        
        const comparison = String(aVal).localeCompare(String(bVal));
        return direction === 'DESC' ? -comparison : comparison;
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

    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    const entry = this.#data.entries[index];
    const updated = {
      ...entry,
      ...updates,
      id: entry.id,
      updated_at: new Date().toISOString(),
      created_at: entry.created_at
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
    if (typeof operations === 'function') {
      operations = [operations];
    }

    const snapshot = JSON.stringify(this.#data);
    this.#autoSave = false;

    try {
      for (const op of operations) {
        await op();
      }
      this.#autoSave = true;
      await this.save();
    } catch (error) {
      this.#data = JSON.parse(snapshot);
      this.#autoSave = true;
      await this.save();
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
