class EntryService {
  #db;
  #parser;
  
  constructor(db, parser) {
    this.#db = db;
    this.#parser = parser;
  }
  
  async addEntry(content) {
    const parseResults = await this.#parser.parse(content);
    
    const entry = {
      raw_content: content,
      ...this.#transformParseResults(parseResults)
    };
    
    const entryId = await this.#db.addEntry(entry);
    
    if (parseResults.categories?.length) {
      await this.#handleCategories(entryId, parseResults.categories);
    }
    
    return entryId;
  }
  
  #transformParseResults(parseResults) {
    return {
      action: parseResults.action,
      contact: parseResults.contact,
      priority: parseResults.priority,
      complexity: parseResults.complexity,
      location: parseResults.location,
      duration: parseResults.duration,
      project: parseResults.project,
      recurring_pattern: parseResults.recurringPattern,
      final_deadline: parseResults.finalDeadline,
      status: parseResults.status
    };
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
