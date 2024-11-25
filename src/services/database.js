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
            this.initializeSequence();
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
                status TEXT DEFAULT 'active',
                complexity INTEGER,
                location TEXT,
                duration INTEGER,
                project TEXT,
                recurring_pattern TEXT,
                dependencies TEXT,
                due_date TEXT,
                final_deadline TEXT
            )`,
            
            "CREATE TABLE IF NOT EXISTS categories (\
                id INTEGER PRIMARY KEY AUTOINCREMENT,\
                name TEXT UNIQUE NOT NULL\
            )",
            
            "CREATE TABLE IF NOT EXISTS entry_categories (\
                entry_id INTEGER,\
                category_id INTEGER,\
                FOREIGN KEY (entry_id) REFERENCES entries(id),\
                FOREIGN KEY (category_id) REFERENCES categories(id),\
                PRIMARY KEY (entry_id, category_id)\
            )",
            
            "CREATE TABLE IF NOT EXISTS links (\
                id INTEGER PRIMARY KEY AUTOINCREMENT,\
                source_entry_id INTEGER,\
                target_entry_id INTEGER,\
                link_type TEXT,\
                FOREIGN KEY (source_entry_id) REFERENCES entries(id),\
                FOREIGN KEY (target_entry_id) REFERENCES entries(id)\
            )"
        ];

        queries.forEach(query => {
            this.db.run(query, (err) => {
                if (err) {
                    console.error('Table creation error:', err);
                }
            });
        });
    }

    async migrateDatabase() {
        // Check if we need to add new columns
        const tableInfo = await this.getTableInfo('entries');
        const existingColumns = tableInfo.map(col => col.name);
        
        const newColumns = [
            { name: 'complexity', type: 'INTEGER' },
            { name: 'location', type: 'TEXT' },
            { name: 'duration', type: 'INTEGER' },
            { name: 'project', type: 'TEXT' },
            { name: 'recurring_pattern', type: 'TEXT' },
            { name: 'dependencies', type: 'TEXT' },
            { name: 'due_date', type: 'TEXT' },
            { name: 'final_deadline', type: 'TEXT' }
        ];

        for (const column of newColumns) {
            if (!existingColumns.includes(column.name)) {
                await this.addColumn('entries', column.name, column.type);
            }
        }
    }

    getTableInfo(tableName) {
        return new Promise((resolve, reject) => {
            this.db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
                if (err) {
                    console.error(`Error getting table info for ${tableName}:`, err);
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    addColumn(tableName, columnName, columnType) {
        return new Promise((resolve, reject) => {
            const query = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;
            this.db.run(query, (err) => {
                if (err) {
                    console.error(`Error adding column ${columnName}:`, err);
                    reject(err);
                    return;
                }
                console.log(`Added column ${columnName} to ${tableName}`);
                resolve();
            });
        });
    }

    async addEntry(entry) {
        return new Promise((resolve, reject) => {
            const {
                rawContent,
                action,
                contact,
                datetime,
                priority = 'None',
                complexity,
                location,
                duration,
                project,
                recurringPattern,
                dependencies,
                dueDate,
                final_deadline,
            } = entry;
            
            const query = `
                INSERT INTO entries (
                    raw_content, action, contact, datetime, priority,
                    complexity, location, duration, project,
                    recurring_pattern, dependencies, due_date, final_deadline
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            this.db.run(
                query,
                [
                    rawContent,
                    action,
                    contact,
                    datetime,
                    priority,
                    complexity,
                    location,
                    duration,
                    project,
                    recurringPattern,
                    dependencies ? JSON.stringify(dependencies) : null,
                    dueDate,
                    final_deadline,
                ],
                function(err) {
                    if (err) {
                        console.error('Error adding entry:', err);
                        reject(err);
                        return;
                    }
                    console.log('Entry added with ID:', this.lastID);
                    resolve(this.lastID);
                }
            );
        });
    }

    async getEntries(filters = {}) {
        return new Promise((resolve, reject) => {
            console.log('Building query with filters:', filters);

            let query = `
                SELECT e.*, GROUP_CONCAT(c.name) as categories
                FROM entries e
                LEFT JOIN entry_categories ec ON e.id = ec.entry_id
                LEFT JOIN categories c ON ec.category_id = c.id
            `;

            const params = [];
            let whereConditions = [];

            // Handle priority filter properly
            if (filters.priority && filters.priority.size > 0) {
                whereConditions.push(`e.priority IN (${Array.from(filters.priority).map(() => '?').join(',')})`);
                params.push(...Array.from(filters.priority));
            }

            // Add status filter if needed
            if (filters.status) {
                whereConditions.push('e.status = ?');
                params.push(filters.status);
            }

            // Add WHERE clause if we have conditions
            if (whereConditions.length > 0) {
                query += ' WHERE ' + whereConditions.join(' AND ');
            }

            // Add GROUP BY before ORDER BY
            query += ' GROUP BY e.id';

            // Add dynamic ORDER BY clause
            if (filters.sort) {
                const { column, direction } = filters.sort;
                const safeColumn = this.getSafeColumnName(column);
                const safeDirection = direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
                
                query += `
                    ORDER BY 
                        CASE WHEN e.${safeColumn} IS NULL THEN 1 ELSE 0 END,
                        e.${safeColumn} ${safeDirection}
                `;
            } else {
                // Default sorting
                query += `
                    ORDER BY 
                        CASE 
                            WHEN e.due_date IS NOT NULL THEN 1
                            WHEN e.datetime IS NOT NULL THEN 2
                            ELSE 3
                        END,
                        e.due_date DESC,
                        e.datetime DESC,
                        e.created_at DESC
                `;
            }

            console.log('Executing query:', query);
            console.log('With params:', params);

            this.db.all(query, params, (err, rows) => {
                if (err) {
                    console.error('Error retrieving entries:', err);
                    reject(err);
                    return;
                }

                // Process the rows
                const entries = rows.map(row => ({
                    ...row,
                    categories: row.categories ? row.categories.split(',') : []
                }));

                console.log('Retrieved entries:', entries);
                resolve(entries);
            });
        });
    }

    // Add helper method to prevent SQL injection
    getSafeColumnName(column) {
        const safeColumns = [
            'raw_content', 'action', 'contact', 'datetime', 'priority',
            'complexity', 'location', 'duration', 'project', 'final_deadline',
            'due_date', 'created_at'
        ];
        return safeColumns.includes(column) ? column : 'created_at';
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

    async deleteEntry(entryId) {
        return new Promise((resolve, reject) => {
            const query = 'DELETE FROM entries WHERE id = ?';
            this.db.run(query, [entryId], function(err) {
                if (err) {
                    console.error('Error deleting entry:', err);
                    reject(err);
                    return;
                }
                console.log('Entry deleted with ID:', entryId);
                resolve();
            });
        });
    }

    async addFinalDeadlineColumn() {
        try {
            // First check if column exists
            const tableInfo = await this.getTableInfo('entries');
            const columnExists = tableInfo.some(col => col.name === 'final_deadline');
            
            if (!columnExists) {
                await this.addColumn('entries', 'final_deadline', 'TEXT');
                console.log('Added final_deadline column');
            } else {
                console.log('final_deadline column already exists');
            }
        } catch (error) {
            console.error('Error handling final_deadline column:', error);
        }
    }

    async migrateExistingDates() {
        try {
            console.log('Starting date migration...');
            
            // Get all entries that need migration
            const entries = await new Promise((resolve, reject) => {
                this.db.all(
                    'SELECT id, datetime, due_date FROM entries WHERE final_deadline IS NULL',
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            console.log(`Found ${entries.length} entries to migrate`);

            // Update each entry
            for (const entry of entries) {
                const finalDeadline = (() => {
                    if (!entry.datetime && !entry.due_date) return null;
                    if (!entry.datetime) return entry.due_date;
                    if (!entry.due_date) return entry.datetime;
                    
                    const dateTimeObj = new Date(entry.datetime);
                    const dueDateObj = new Date(entry.due_date);
                    return dateTimeObj > dueDateObj ? entry.datetime : entry.due_date;
                })();

                if (finalDeadline) {
                    await new Promise((resolve, reject) => {
                        this.db.run(
                            'UPDATE entries SET final_deadline = ? WHERE id = ?',
                            [finalDeadline, entry.id],
                            (err) => {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });
                }
            }

            console.log('Date migration completed successfully');
        } catch (error) {
            console.error('Error during date migration:', error);
        }
    }

    static async runDateMigration() {
        const db = new DatabaseService();
        await db.migrateExistingDates();
    }

    async initializeSequence() {
        try {
            await this.initializeTables();
            await this.migrateDatabase();
            await this.addFinalDeadlineColumn();
            await this.migrateExistingDates();
            console.log('Database initialization completed successfully');
        } catch (error) {
            console.error('Error during database initialization:', error);
        }
    }
}

module.exports = DatabaseService;
