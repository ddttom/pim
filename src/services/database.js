export default class Database {
  constructor() {
    this.entries = [];
    this.nextId = 1;
  }

  async init() {
    // No initialization needed for in-memory database
    return Promise.resolve();
  }

  async save(entry) {
    // Check if entry already exists
    const existingIndex = this.entries.findIndex(e => e.id === entry.id);
    
    if (existingIndex >= 0) {
      // Update existing entry
      this.entries[existingIndex] = entry;
      return entry;
    }
    
    // Create new entry
    const newEntry = { ...entry, id: this.nextId++ };
    this.entries.push(newEntry);
    return newEntry;
  }

  async getAll() {
    return [...this.entries];
  }

  async getById(id) {
    return this.entries.find(e => e.id === id);
  }

  async delete(id) {
    this.entries = this.entries.filter(e => e.id !== id);
  }

  async clear() {
    this.entries = [];
    this.nextId = 1;
  }
}
