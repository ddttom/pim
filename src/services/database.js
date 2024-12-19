class DatabaseService {
    async saveEntry(entry) {
        // If type is not specified, assume it's a note
        const type = entry.type || 'note';
        
        // Only parse if it's a note type
        const parsedEntry = type === 'note' 
            ? await this.parser.parse(entry.content)
            : { original: entry.content, parsed: { text: entry.content, plugins: {} } };

        const entryToSave = {
            ...entry,
            type,
            parsed: parsedEntry.parsed,
            original: parsedEntry.original,
            updatedAt: new Date().toISOString()
        };

        // Save to database
        await this.db.addEntry(entryToSave);
        return entryToSave;
    }

    async getEntries(filter = {}) {
        const entries = await this.db.get('entries') || [];
        
        // Add type filter
        if (filter.type) {
            return entries.filter(entry => entry.type === filter.type);
        }

        return entries.map(entry => ({
            ...entry,
            type: entry.type || 'note' // Default type for legacy entries
        }));
    }
} 
