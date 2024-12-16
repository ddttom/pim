class EntryService {
  #db;
  #parser;
  
  constructor(db, parser) {
    if (!db) throw new Error('Database service is required');
    if (!parser) throw new Error('Parser service is required');
    
    this.#db = db;
    this.#parser = parser;
  }
  
  async addEntry(content) {
    try {
      console.log('Parsing content:', content);
      const parseResults = this.#parser.parse(content);
      console.log('Parse results:', parseResults);
      
      const entry = {
        raw_content: parseResults.raw_content,
        action: parseResults.parsed.action,
        contact: parseResults.parsed.contact,
        priority: parseResults.parsed.priority || null,
        complexity: parseResults.parsed.complexity || null,
        location: parseResults.parsed.location || null,
        duration: parseResults.parsed.duration || null,
        project: parseResults.parsed.project?.project || null,
        recurring_pattern: parseResults.parsed.recurring_pattern || null,
        final_deadline: parseResults.parsed.final_deadline || null,
        status: parseResults.parsed.status || 'None'
      };
      
      console.log('Transformed entry:', entry);
      
      const entryId = await this.#db.addEntry(entry);
      console.log('Entry saved with ID:', entryId);
      
      if (parseResults.parsed.categories?.length) {
        await this.#handleCategories(entryId, parseResults.parsed.categories);
      }
      
      return entryId;
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  }
  
  async #handleCategories(entryId, categories) {
    for (const category of categories) {
      const categoryId = await this.#db.addCategory(category);
      await this.#db.linkEntryToCategory(entryId, categoryId);
    }
  }
  
  async getEntries(filters) {
    return this.#db.getEntries(filters);
  }
}

module.exports = EntryService; 
