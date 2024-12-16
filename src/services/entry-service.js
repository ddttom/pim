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
      logger.info('Parsing entry content:', content);
      
      // Get the raw parser output
      const parserOutput = this.#parser.parse(content);
      if (!parserOutput) {
        throw new Error('Failed to parse entry content');
      }

      logger.debug('Parser output:', parserOutput);

      // Add entry to database with exact parser output structure
      const entryId = await this.#db.addEntry(parserOutput);
      logger.info('Entry added successfully:', entryId);
      
      return entryId;
    } catch (error) {
      logger.error('Failed to add entry:', error);
      throw error;
    }
  }

  async updateEntry(id, updates) {
    try {
      logger.info('Updating entry:', id, updates);

      // If there's new content, get fresh parser output
      if (updates.raw_content) {
        const parserOutput = this.#parser.parse(updates.raw_content);
        if (!parserOutput) {
          throw new Error('Failed to parse updated content');
        }
        updates = parserOutput;
      }

      const updated = await this.#db.updateEntry(id, updates);
      logger.info('Entry updated successfully:', id);
      
      return updated;
    } catch (error) {
      logger.error('Failed to update entry:', error);
      throw error;
    }
  }

  async getEntry(id) {
    try {
      return await this.#db.getEntry(id);
    } catch (error) {
      logger.error('Failed to get entry:', error);
      throw error;
    }
  }

  async deleteEntry(id) {
    try {
      return await this.#db.deleteEntry(id);
    } catch (error) {
      logger.error('Failed to delete entry:', error);
      throw error;
    }
  }

  async getEntries(filters = {}) {
    try {
      return await this.#db.getEntries(filters);
    } catch (error) {
      logger.error('Failed to get entries:', error);
      throw error;
    }
  }

  // Plugin data operations
  async updatePluginData(entryId, pluginName, data) {
    try {
      const entry = await this.#db.getEntry(entryId);
      if (!entry) {
        throw new Error(`Entry with id ${entryId} not found`);
      }

      const updates = {
        plugins: {
          ...entry.plugins,
          [pluginName]: data
        }
      };

      return await this.#db.updateEntry(entryId, updates);
    } catch (error) {
      logger.error('Failed to update plugin data:', error);
      throw error;
    }
  }

  async getPluginData(entryId, pluginName) {
    try {
      const entry = await this.#db.getEntry(entryId);
      if (!entry) {
        throw new Error(`Entry with id ${entryId} not found`);
      }

      return entry.plugins[pluginName] || null;
    } catch (error) {
      logger.error('Failed to get plugin data:', error);
      throw error;
    }
  }
}

module.exports = EntryService;
