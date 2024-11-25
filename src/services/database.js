const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const DEFAULT_CONFIG = require('../config/parser.config.js');
const fs = require('fs');

class DatabaseService {
    constructor(dbPath) {
        this.db = null;
        this.initialized = false;
        this.dbPath = dbPath;
        console.log('Database path:', this.dbPath);
    }

    async initialize() {
        if (this.initialized) return;

        try {
            this.db = await open({
                filename: this.dbPath,
                driver: sqlite3.Database
            });

            await this.setupDatabase();            
            this.initialized = true;
        } catch (error) {
            console.error('Database initialization error:', error);
            throw error;
        }
    }

    async setupDatabase() {
        try {
            // Create entries table
            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    raw_content TEXT,
                    action TEXT,
                    contact TEXT,
                    datetime TEXT,
                    priority TEXT,
                    complexity TEXT,
                    location TEXT,
                    duration INTEGER,
                    project TEXT,
                    recurring_pattern TEXT,
                    due_date TEXT,
                    final_deadline TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create categories table
            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE
                )
            `);

            // Create entry_categories junction table
            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS entry_categories (
                    entry_id INTEGER,
                    category_id INTEGER,
                    PRIMARY KEY (entry_id, category_id),
                    FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE,
                    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
                )
            `);

            // Create settings table
            await this.db.exec(`
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Check if settings need to be initialized
            const settingsCount = await this.db.get('SELECT COUNT(*) as count FROM settings');
            if (settingsCount.count === 0) {
                console.log('Initializing settings from default config');
                await this.initializeSettings();
            }

        } catch (error) {
            console.error('Error setting up database:', error);
            throw error;
        }
    }

    async initializeSettings() {
        try {
            console.log('Starting initialization of default settings');
            await this.db.run('DELETE FROM settings');
            
            // Flatten the settings before saving
            const flattenedSettings = flattenSettings(DEFAULT_CONFIG);
            console.log('Flattened settings:', flattenedSettings);
            
            // Save each flattened setting
            for (const [key, value] of Object.entries(flattenedSettings)) {
                const processedValue = this.processSettingForStorage(value);
                await this.saveSetting(key, processedValue);
            }

            // Verify settings were stored correctly
            const verified = await this.verifySettings();
            if (!verified) {
                throw new Error('Settings verification failed after initialization');
            }
        } catch (error) {
            console.error('Error initializing settings:', error);
            throw error;
        }
    }

    processSettingForStorage(value) {
        console.log('Processing value for storage:', value);
        
        if (value instanceof RegExp) {
            const processed = {
                type: 'regex',
                pattern: value.source,
                flags: value.flags
            };
            console.log('Processed RegExp:', processed);
            return processed;
        }

        if (Array.isArray(value)) {
            const processed = value.map(item => this.processSettingForStorage(item));
            console.log('Processed array:', processed);
            return processed;
        }

        if (value && typeof value === 'object') {
            const processed = {};
            for (const [k, v] of Object.entries(value)) {
                processed[k] = this.processSettingForStorage(v);
            }
            console.log('Processed object:', processed);
            return processed;
        }

        return value;
    }

    processSettingFromStorage(value) {
        console.log('Processing value from storage:', value);
        
        if (value && typeof value === 'object') {
            if (value.type === 'regex') {
                const processed = new RegExp(value.pattern, value.flags);
                console.log('Processed RegExp from storage:', processed);
                return processed;
            }

            if (Array.isArray(value)) {
                const processed = value.map(item => this.processSettingFromStorage(item));
                console.log('Processed array from storage:', processed);
                return processed;
            }

            const processed = {};
            for (const [k, v] of Object.entries(value)) {
                processed[k] = this.processSettingFromStorage(v);
            }
            console.log('Processed object from storage:', processed);
            return processed;
        }

        return value;
    }

    async getAllSettings() {
        try {
            const settings = {};
            const rows = await this.db.all('SELECT key, value FROM settings');
            
            for (const row of rows) {
                try {
                    const parsedValue = JSON.parse(row.value);
                    settings[row.key] = this.processSettingFromStorage(parsedValue);
                } catch (e) {
                    console.error(`Error parsing setting ${row.key}:`, e);
                    settings[row.key] = DEFAULT_CONFIG[row.key];
                }
            }

            // If no settings exist, return default config
            if (Object.keys(settings).length === 0) {
                console.log('No settings found, using DEFAULT_CONFIG');
                return DEFAULT_CONFIG;
            }

            // Unflatten the settings before returning
            const unflattened = unflattenSettings(settings);
            console.log('Unflattened settings:', unflattened);
            
            return unflattened;
        } catch (error) {
            console.error('Error getting settings:', error);
            throw error;
        }
    }

    async saveSetting(key, value) {
        try {
            console.log(`Saving setting ${key}:`, {
                original: value,
                type: typeof value,
                isRegExp: value instanceof RegExp
            });

            const processedValue = this.processSettingForStorage(value);
            console.log(`Processed value for ${key}:`, processedValue);

            const stringValue = JSON.stringify(processedValue);
            console.log(`Stringified value for ${key}:`, stringValue);
            
            await this.db.run(`
                INSERT OR REPLACE INTO settings (key, value, updated_at) 
                VALUES (?, ?, CURRENT_TIMESTAMP)
            `, [key, stringValue]);

            // Verify the saved setting against the original value
            console.log(`Verifying saved setting ${key}...`);
            const savedValue = await this.getSetting(key);
            console.log(`Retrieved saved value for ${key}:`, savedValue);
            
            // Compare with the original value that was passed in
            const isValid = this.compareValues(value, savedValue);
            if (!isValid) {
                console.error(`Verification failed for ${key}`);
                throw new Error(`Setting verification failed for key: ${key}`);
            }
            console.log(`Successfully saved and verified setting ${key}`);
        } catch (error) {
            console.error(`Error saving setting ${key}:`, error);
            throw error;
        }
    }

    async verifySetting(key, originalValue) {
        try {
            console.log(`Verifying setting ${key}:`, {
                original: originalValue,
                originalType: typeof originalValue
            });

            const row = await this.db.get('SELECT value FROM settings WHERE key = ?', [key]);
            if (!row) {
                console.log(`No stored value found for ${key}`);
                return false;
            }

            const parsedValue = JSON.parse(row.value);
            console.log(`Parsed value for ${key}:`, parsedValue);

            // Don't process the value if it's already in the correct format
            const storedValue = parsedValue.type === 'regex' ? parsedValue : this.processSettingFromStorage(parsedValue);
            console.log(`Final stored value for ${key}:`, storedValue);

            const result = this.compareValues(originalValue, storedValue);
            console.log(`Comparison result for ${key}:`, result);
            
            return result;
        } catch (error) {
            console.error(`Error verifying setting ${key}:`, error);
            return false;
        }
    }

    async verifySettings() {
        try {
            const settings = await this.getAllSettings();
            // Don't compare against DEFAULT_CONFIG, just ensure we got valid settings back
            return settings && typeof settings === 'object' && Object.keys(settings).length > 0;
        } catch (error) {
            console.error('Error verifying settings:', error);
            return false;
        }
    }

    compareValues(original, stored) {
        console.log('Comparing values:', {
            original,
            stored,
            originalType: typeof original,
            storedType: typeof stored,
            isOriginalRegExp: original instanceof RegExp,
            isStoredRegExp: stored instanceof RegExp
        });

        // Handle RegExp objects and RegExp-like objects
        if (original instanceof RegExp || (original && original.type === 'regex')) {
            // Convert both to RegExp-like objects for comparison
            const originalRegex = original instanceof RegExp ? 
                { type: 'regex', pattern: original.source, flags: original.flags } : 
                original;
                
            const storedRegex = stored instanceof RegExp ? 
                { type: 'regex', pattern: stored.source, flags: stored.flags } : 
                stored;

            console.log('Comparing RegExp objects:', { originalRegex, storedRegex });

            // Normalize empty flags
            const originalFlags = originalRegex.flags || '';
            const storedFlags = storedRegex.flags || '';
            
            // Compare normalized values
            const patternsMatch = originalRegex.pattern === storedRegex.pattern;
            const flagsMatch = originalFlags === storedFlags;
            
            console.log('RegExp comparison results:', {
                patternsMatch,
                flagsMatch,
                originalPattern: originalRegex.pattern,
                storedPattern: storedRegex.pattern,
                originalFlags,
                storedFlags
            });
            
            return patternsMatch && flagsMatch;
        }

        // Handle arrays
        if (Array.isArray(original)) {
            if (!Array.isArray(stored)) {
                console.log('Array mismatch:', { original, stored });
                return false;
            }
            if (original.length !== stored.length) {
                console.log('Array length mismatch:', { original, stored });
                return false;
            }
            return original.every((item, index) => {
                const result = this.compareValues(item, stored[index]);
                console.log(`Array item ${index} comparison:`, result);
                return result;
            });
        }

        // Handle objects
        if (original && typeof original === 'object') {
            if (!stored || typeof stored !== 'object') {
                console.log('Object type mismatch:', { original, stored });
                return false;
            }

            const originalKeys = Object.keys(original).sort();
            const storedKeys = Object.keys(stored).sort();

            if (originalKeys.length !== storedKeys.length || 
                !originalKeys.every((key, i) => key === storedKeys[i])) {
                console.log('Object keys mismatch:', {
                    originalKeys,
                    storedKeys,
                    missing: originalKeys.filter(k => !storedKeys.includes(k)),
                    extra: storedKeys.filter(k => !originalKeys.includes(k))
                });
                return false;
            }

            return originalKeys.every(key => {
                const result = this.compareValues(original[key], stored[key]);
                console.log(`Comparing key ${key}:`, { result });
                return result;
            });
        }

        // Handle primitive values
        const result = original === stored;
        console.log('Primitive comparison:', { original, stored, result });
        return result;
    }

    async getEntries(filters = {}) {
        try {
            console.log('=== Getting Entries from Database ===');
            console.log('Filters:', filters);
            
            let query = `
                SELECT e.*, GROUP_CONCAT(c.name) as categories
                FROM entries e
                LEFT JOIN entry_categories ec ON e.id = ec.entry_id
                LEFT JOIN categories c ON ec.category_id = c.id
            `;

            const whereConditions = [];
            const params = [];

            // Add filter conditions
            if (filters.priority && filters.priority.size > 0) {
                whereConditions.push(`e.priority IN (${Array.from(filters.priority).map(() => '?').join(',')})`);
                params.push(...Array.from(filters.priority));
            }

            if (filters.date && filters.date.size > 0) {
                whereConditions.push(`DATE(e.final_deadline) IN (${Array.from(filters.date).map(() => '?').join(',')})`);
                params.push(...Array.from(filters.date));
            }

            if (filters.categories && filters.categories.size > 0) {
                whereConditions.push(`c.name IN (${Array.from(filters.categories).map(() => '?').join(',')})`);
                params.push(...Array.from(filters.categories));
            }

            if (whereConditions.length > 0) {
                query += ' WHERE ' + whereConditions.join(' AND ');
            }

            // Add group by
            query += ' GROUP BY e.id';

            // Add sorting
            if (filters.sort) {
                const { column, direction } = filters.sort;
                query += `
                    ORDER BY 
                        CASE WHEN e.${column} IS NULL THEN 1 ELSE 0 END,
                        e.${column} ${direction.toUpperCase()}
                `;
            }

            console.log('Executing query:', query);
            console.log('Query parameters:', params);

            const entries = await this.db.all(query, params);
            console.log('Retrieved entries count:', entries.length);
            console.log('First entry sample:', entries[0]);

            return entries;
        } catch (error) {
            console.error('=== Get Entries Error ===');
            console.error('Error details:', error);
            throw error;
        }
    }

    async addEntry(entry) {
        try {
            console.log('Adding entry to database:', entry);
            
            const result = await this.db.run(`
                INSERT INTO entries (
                    raw_content, action, contact, datetime, priority,
                    complexity, location, duration, project,
                    recurring_pattern, due_date, final_deadline,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                entry.raw_content || null,
                entry.action || null,
                entry.contact || null,
                entry.datetime || null,
                entry.priority || null,
                entry.complexity || null,
                entry.location || null,
                entry.duration || null,
                entry.project || null,
                entry.recurring_pattern || null,
                entry.due_date || null,
                entry.final_deadline || null,
                entry.created_at || new Date().toISOString()
            ]);

            console.log('Entry added with result:', result);
            return result.lastID;
        } catch (error) {
            console.error('Error adding entry:', error);
            throw error;
        }
    }

    async deleteEntry(id) {
        try {
            await this.db.run('DELETE FROM entries WHERE id = ?', [id]);
        } catch (error) {
            console.error('Error deleting entry:', error);
            throw error;
        }
    }

    async getSetting(key) {
        try {
            console.log(`Getting setting ${key}`);
            const row = await this.db.get('SELECT value FROM settings WHERE key = ?', [key]);
            
            if (!row) {
                console.log(`No value found for ${key}, using default`);
                return DEFAULT_CONFIG[key];
            }

            const parsedValue = JSON.parse(row.value);
            const processedValue = this.processSettingFromStorage(parsedValue);
            console.log(`Retrieved setting ${key}:`, processedValue);
            
            return processedValue;
        } catch (error) {
            console.error(`Error getting setting ${key}:`, error);
            throw error;
        }
    }

    async backupSettings(backupPath) {
        try {
            console.log('Creating settings backup at:', backupPath);
            
            // Get current settings from database
            const settings = await this.getAllSettings();
            console.log('Retrieved current settings for backup:', settings);
            
            // Process settings for backup
            const processForBackup = (value) => {
                if (value instanceof RegExp) {
                    return {
                        type: 'regex',
                        pattern: value.source,
                        flags: value.flags
                    };
                }
                
                if (Array.isArray(value)) {
                    return value.map(processForBackup);
                }
                
                if (value && typeof value === 'object') {
                    const processed = {};
                    for (const [k, v] of Object.entries(value)) {
                        processed[k] = processForBackup(v);
                    }
                    return processed;
                }
                
                return value;
            };
            
            // Add metadata to the backup
            const backup = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                settings: processForBackup(settings)
            };
            
            console.log('Processed backup data:', backup);
            
            // Write to file
            await fs.promises.writeFile(
                backupPath, 
                JSON.stringify(backup, null, 2)
            );
            
            console.log('Settings backup created successfully');
            return true;
        } catch (error) {
            console.error('Error creating settings backup:', error);
            throw error;
        }
    }

    async restoreSettings(backupPath) {
        try {
            console.log('Restoring settings from:', backupPath);
            
            // Read backup file
            const backupContent = await fs.promises.readFile(backupPath, 'utf8');
            const backup = JSON.parse(backupContent);
            
            // Validate backup format
            if (!backup.version || !backup.timestamp || !backup.settings) {
                throw new Error('Invalid backup file format');
            }
            
            // Process backup settings
            const processFromBackup = (value) => {
                if (value && typeof value === 'object') {
                    if (value.type === 'regex') {
                        return new RegExp(value.pattern, value.flags);
                    }
                    
                    if (Array.isArray(value)) {
                        return value.map(processFromBackup);
                    }
                    
                    const processed = {};
                    for (const [k, v] of Object.entries(value)) {
                        processed[k] = processFromBackup(v);
                    }
                    return processed;
                }
                return value;
            };
            
            const processedSettings = processFromBackup(backup.settings);
            
            // Clear existing settings
            await this.db.run('DELETE FROM settings');
            
            // Restore settings
            const flattenedSettings = flattenSettings(processedSettings);
            for (const [key, value] of Object.entries(flattenedSettings)) {
                await this.saveSetting(key, value);
            }
            
            // Verify restored settings
            const verified = await this.verifySettings();
            if (!verified) {
                throw new Error('Settings verification failed after restore');
            }
            
            console.log('Settings restored successfully');
            return true;
        } catch (error) {
            console.error('Error restoring settings:', error);
            throw error;
        }
    }
}

// Add this helper method to unflatten settings
function unflattenSettings(settings) {
    const result = {};
    
    for (const [key, value] of Object.entries(settings)) {
        const keys = key.split('.');
        let current = result;
        
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (i === keys.length - 1) {
                current[k] = value;
            } else {
                current[k] = current[k] || {};
                current = current[k];
            }
        }
    }
    
    return result;
}

// Add this helper method to flatten settings
function flattenSettings(obj, prefix = '') {
    const flattened = {};
    
    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof RegExp)) {
            Object.assign(flattened, flattenSettings(value, newKey));
        } else {
            flattened[newKey] = value;
        }
    }
    
    return flattened;
}

module.exports = DatabaseService;
