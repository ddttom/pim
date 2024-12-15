const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const os = require('os');

async function migrate(dbPath) {
    return new Promise((resolve, reject) => {
        // If dbPath is not provided, use default location
        if (!dbPath) {
            const appDataPath = process.env.APPDATA || 
                (process.platform === 'darwin' ? path.join(os.homedir(), 'Library/Application Support') : path.join(os.homedir(), '.config'));
            dbPath = path.join(appDataPath, 'pim', 'pim.db');
            
            const dbDir = path.dirname(dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }
        }
        
        console.log('Using database path:', dbPath);
        
        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error connecting to database:', err);
                reject(err);
                return;
            }
            
            console.log('Connected to database for migration');
            
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // First check if the entries table exists
                db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='entries'", (err, table) => {
                    if (err) {
                        console.error('Error checking table existence:', err);
                        db.run('ROLLBACK');
                        reject(err);
                        return;
                    }

                    // If the table doesn't exist, create it and resolve (fresh installation)
                    if (!table) {
                        console.log('No existing entries table found - fresh installation');
                        db.run('COMMIT');
                        db.close();
                        resolve();
                        return;
                    }

                    // If table exists, proceed with migration
                    db.run(`
                        CREATE TABLE IF NOT EXISTS entries_new (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            raw_content TEXT,
                            action TEXT,
                            contact TEXT,
                            priority TEXT,
                            complexity TEXT,
                            location TEXT,
                            duration INTEGER,
                            project TEXT,
                            recurring_pattern TEXT,
                            final_deadline TEXT,
                            status TEXT,
                            created_at TEXT,
                            updated_at TEXT
                        )
                    `, (err) => {
                        if (err) {
                            console.error('Error creating new table:', err);
                            db.run('ROLLBACK');
                            reject(err);
                            return;
                        }

                        // Copy data from existing table
                        const now = new Date().toISOString();
                        db.run(`
                            INSERT INTO entries_new (
                                id, raw_content, action, contact, priority,
                                complexity, location, duration,
                                project, recurring_pattern, final_deadline,
                                status, created_at, updated_at
                            )
                            SELECT 
                                id, 
                                raw_content, 
                                action, 
                                contact, 
                                priority, 
                                complexity, 
                                location, 
                                duration,
                                project, 
                                recurring_pattern, 
                                final_deadline,
                                'None' as status,
                                COALESCE(created_at, '${now}') as created_at,
                                '${now}' as updated_at
                            FROM entries
                        `, (err) => {
                            if (err) {
                                console.error('Error copying data:', err);
                                db.run('ROLLBACK');
                                reject(err);
                                return;
                            }

                            // Drop the old table
                            db.run(`DROP TABLE IF EXISTS entries`, (err) => {
                                if (err) {
                                    console.error('Error dropping old table:', err);
                                    db.run('ROLLBACK');
                                    reject(err);
                                    return;
                                }

                                // Rename the new table
                                db.run(`ALTER TABLE entries_new RENAME TO entries`, (err) => {
                                    if (err) {
                                        console.error('Error renaming table:', err);
                                        db.run('ROLLBACK');
                                        reject(err);
                                        return;
                                    }

                                    // Commit the transaction
                                    db.run('COMMIT', (err) => {
                                        if (err) {
                                            console.error('Error committing transaction:', err);
                                            db.run('ROLLBACK');
                                            reject(err);
                                            return;
                                        }
                                        
                                        console.log('Migration completed successfully');
                                        db.close();
                                        resolve();
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

module.exports = {
    migrate
};

if (require.main === module) {
    migrate()
        .then(() => {
            console.log('Migration completed');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
}
