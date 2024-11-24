const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const winston = require('winston');

class DatabaseService {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, '../../data/pim.db'), (err) => {
            if (err) {
                console.error('Database connection error:', err);
                return;
            }
            this.initializeTables();
        });
    }

    initializeTables() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS entries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                raw_content TEXT NOT NULL,
                action TEXT,
                contact TEXT,
                datetime TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                priority TEXT CHECK(priority IN ('None', 'Low', 'Medium', 'High', 'Urgent')),
                status TEXT DEFAULT 'active'
            )`,
            
            `CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL
            )`,
            
            `CREATE TABLE IF NOT EXISTS entry_categories (
                entry_id INTEGER,
                category_id INTEGER,
                FOREIGN KEY (entry_id) REFERENCES entries(id),
                FOREIGN KEY (category_id) REFERENCES categories(id),
                PRIMARY KEY (entry_id, category_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_entry_id INTEGER,
                target_entry_id INTEGER,
                link_type TEXT,
                FOREIGN KEY (source_entry_id) REFERENCES entries(id),
                FOREIGN KEY (target_entry_id) REFERENCES entries(id)
            )`
        ];

        queries.forEach(query => {
            this.db.run(query, (err) => {
                if (err) {
                    console.error('Table creation error:', err);
                }
            });
        });
    }

    async addEntry(entry) {
        return new Promise((resolve, reject) => {
            const { rawContent, action, contact, datetime, priority = 'None' } = entry;
            
            const query = `INSERT INTO entries (raw_content, action, contact, datetime, priority)
                          VALUES (?, ?, ?, ?, ?)`;
            
            this.db.run(query, [rawContent, action, contact, datetime, priority], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this.lastID);
            });
        });
    }

    async getEntries(filters = {}) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM entries WHERE 1=1';
            const params = [];

            if (filters.priority) {
                query += ' AND priority = ?';
                params.push(filters.priority);
            }

            if (filters.status) {
                query += ' AND status = ?';
                params.push(filters.status);
            }

            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    async addCategory(name) {
        return new Promise((resolve, reject) => {
            const query = 'INSERT OR IGNORE INTO categories (name) VALUES (?)';
            this.db.run(query, [name], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this.lastID);
            });
        });
    }

    async linkEntryToCategory(entryId, categoryId) {
        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO entry_categories (entry_id, category_id) VALUES (?, ?)';
            this.db.run(query, [entryId, categoryId], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this.lastID);
            });
        });
    }
}

module.exports = new DatabaseService();
