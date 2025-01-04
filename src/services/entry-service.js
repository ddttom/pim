const logger = require('./logger');

class EntryService {
  #db;
  #parser;

  constructor(database, parser) {
    this.#db = database;
    this.#parser = parser;
  }

  async addEntry(content) {
    try {
      const parsed = this.#parser.parse(content);
      const entry = {
        content,
        parsed,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const id = await this.#db.addEntry(entry);
      return { ...entry, id };
    } catch (error) {
      console.error('Failed to add entry:', error);
      throw error;
    }
  }

  async updateEntry(id, updates) {
    try {
      if (updates.content) {
        const parsed = this.#parser.parse(updates.content);
        updates.parsed = parsed;
      }
      
      updates.updated_at = new Date().toISOString();
      const updated = await this.#db.updateEntry(id, updates);
      return updated;
    } catch (error) {
      console.error('Failed to update entry:', error);
      throw error;
    }
  }

  async getEntry(id) {
    try {
      return await this.#db.getEntry(id);
    } catch (error) {
      console.error('Failed to get entry:', error);
      throw error;
    }
  }

  async deleteEntry(id) {
    try {
      return await this.#db.deleteEntry(id);
    } catch (error) {
      console.error('Failed to delete entry:', error);
      throw error;
    }
  }

  async getEntries(filters = {}) {
    try {
      return await this.#db.getEntries(filters);
    } catch (error) {
      console.error('Failed to get entries:', error);
      throw error;
    }
  }

}

module.exports = EntryService;
