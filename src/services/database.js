const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const DEFAULT_CONFIG = require('../config/parser.config.js');

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
        } catch (error) {
            console.error('Error setting up database:', error);
            throw error;
        }
    }

    async getEntries(filters = {}) {
        try {
            console.log('Building query with filters:', filters);
            
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
            console.log('With params:', params);

            const entries = await this.db.all(query, params);
            console.log('Retrieved entries:', entries);

            return entries;
        } catch (error) {
            console.error('Error getting entries:', error);
            throw error;
        }
    }

    async addEntry(entry) {
        try {
            const result = await this.db.run(`
                INSERT INTO entries (
                    raw_content, action, contact, datetime, priority,
                    complexity, location, duration, project,
                    recurring_pattern, due_date, final_deadline
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                entry.raw_content,
                entry.action,
                entry.contact,
                entry.datetime,
                entry.priority,
                entry.complexity,
                entry.location,
                entry.duration,
                entry.project,
                entry.recurring_pattern,
                entry.due_date,
                entry.final_deadline
            ]);

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

    async getAllSettings() {
        return DEFAULT_CONFIG;
    }
}

module.exports = DatabaseService;
