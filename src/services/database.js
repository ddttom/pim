const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

class DatabaseService {
  #db;
  #schema;

  constructor() {
    this.#schema = {
      tables: {
        entries: {
          fields: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            raw_content: 'TEXT NOT NULL',
            action: 'TEXT',
            contact: 'TEXT',
            priority: 'TEXT',
            complexity: 'TEXT',
            location: 'TEXT',
            duration: 'INTEGER',
            project: 'TEXT',
            recurring_pattern: 'TEXT',
            final_deadline: 'TEXT',
            status: 'TEXT',
            created_at: 'TEXT NOT NULL',
            updated_at: 'TEXT NOT NULL'
          }
        },
        categories: {
          fields: {
            id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
            name: 'TEXT UNIQUE NOT NULL'
          }
        },
        entry_categories: {
          fields: {
            entry_id: 'INTEGER',
            category_id: 'INTEGER'
          },
          constraints: [
            'FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE',
            'FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE',
            'PRIMARY KEY (entry_id, category_id)'
          ]
        },
        settings: {
          fields: {
            key: 'TEXT PRIMARY KEY',
            value: 'TEXT NOT NULL',
            created_at: 'TEXT NOT NULL',
            updated_at: 'TEXT NOT NULL'
          }
        }
      }
    };
  }

  async initialize(dbPath) {
    if (!dbPath) {
      throw new Error('Database path must be provided');
    }

    try {
      this.#db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });
      
      await this.#db.exec('PRAGMA foreign_keys = ON');
      await this.migrate();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw new Error(`Failed to initialize database: ${error.message}`);
    }
  }

  isInitialized() {
    return !!this.#db;
  }

  async #executeQuery(operation) {
    if (!this.isInitialized()) {
      throw new Error('Database is not initialized');
    }

    try {
      return await operation();
    } catch (error) {
      console.error('Database operation failed:', error);
      throw error;
    }
  }

  async migrate() {
    const queries = [];
    
    for (const [tableName, schema] of Object.entries(this.#schema.tables)) {
      const fields = Object.entries(schema.fields)
        .map(([name, type]) => `${name} ${type}`)
        .join(',\n  ');

      const constraints = schema.constraints 
        ? ',\n  ' + schema.constraints.join(',\n  ')
        : '';

      queries.push(`
        CREATE TABLE IF NOT EXISTS ${tableName} (
          ${fields}${constraints}
        )
      `);
    }

    await this.#db.exec('BEGIN TRANSACTION');
    
    try {
      for (const query of queries) {
        await this.#db.exec(query);
      }
      await this.#db.exec('COMMIT');
    } catch (error) {
      await this.#db.exec('ROLLBACK');
      throw error;
    }
  }

  // Entry operations
  async addEntry(entry) {
    return this.#executeQuery(async () => {
      console.log('Adding entry to database:', entry);
      
      const { raw_content, action, contact, priority, complexity, 
              location, duration, project, recurring_pattern, 
              final_deadline, status } = entry;
      
      const now = new Date().toISOString();

      try {
        const result = await this.#db.run(`
          INSERT INTO entries (
            raw_content, action, contact, priority,
            complexity, location, duration, project,
            recurring_pattern, final_deadline, status,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          raw_content, action, contact, priority,
          complexity, location, duration, project,
          recurring_pattern, final_deadline, status,
          now, now
        ]);

        console.log('Entry added successfully:', result);
        return result.lastID;
      } catch (error) {
        console.error('Error adding entry to database:', error);
        throw error;
      }
    });
  }

  // Settings operations
  async getSetting(key) {
    return this.#db.get(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    );
  }

  async setSetting(key, value) {
    const now = new Date().toISOString();
    
    await this.#db.run(`
      INSERT INTO settings (key, value, created_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET 
        value = excluded.value,
        updated_at = excluded.updated_at
    `, [key, value, now, now]);
  }

  // Category operations
  async addCategory(name) {
    const result = await this.#db.run(
      'INSERT INTO categories (name) VALUES (?)',
      [name]
    );
    return result.lastID;
  }

  async linkEntryToCategory(entryId, categoryId) {
    await this.#db.run(`
      INSERT INTO entry_categories (entry_id, category_id)
      VALUES (?, ?)
    `, [entryId, categoryId]);
  }

  async getEntries(filters = {}) {
    return this.#executeQuery(async () => {
      let query = `
        SELECT e.*,
               GROUP_CONCAT(c.name) as categories
        FROM entries e
        LEFT JOIN entry_categories ec ON e.id = ec.entry_id
        LEFT JOIN categories c ON ec.category_id = c.id
      `;

      const whereConditions = [];
      const params = [];

      if (filters.priority?.size) {
        whereConditions.push(`e.priority IN (${Array.from(filters.priority).map(() => '?').join(',')})`);
        params.push(...Array.from(filters.priority));
      }

      if (filters.date?.size) {
        whereConditions.push(`DATE(e.final_deadline) IN (${Array.from(filters.date).map(() => '?').join(',')})`);
        params.push(...Array.from(filters.date));
      }

      if (filters.categories?.size) {
        whereConditions.push(`c.name IN (${Array.from(filters.categories).map(() => '?').join(',')})`);
        params.push(...Array.from(filters.categories));
      }

      if (whereConditions.length) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }

      query += ' GROUP BY e.id';

      if (filters.sort) {
        const { column, direction } = filters.sort;
        const safeColumn = this.#getSafeColumnName(column);
        const safeDirection = direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        query += `
          ORDER BY 
            CASE WHEN e.${safeColumn} IS NULL THEN 1 ELSE 0 END,
            e.${safeColumn} ${safeDirection}
        `;
      }

      return this.#db.all(query, params);
    });
  }

  #getSafeColumnName(column) {
    const allowedColumns = new Set([
      'id', 'raw_content', 'action', 'contact', 'priority',
      'complexity', 'location', 'duration', 'project',
      'recurring_pattern', 'final_deadline', 'status',
      'created_at', 'updated_at'
    ]);

    if (!allowedColumns.has(column)) {
      throw new Error(`Invalid column name: ${column}`);
    }

    return column;
  }

  async deleteEntry(id) {
    return this.#executeQuery(async () => {
      await this.#db.exec('BEGIN TRANSACTION');
      
      try {
        // Delete from entry_categories first due to foreign key constraint
        await this.#db.run(
          'DELETE FROM entry_categories WHERE entry_id = ?',
          [id]
        );
        
        // Then delete the entry
        const result = await this.#db.run(
          'DELETE FROM entries WHERE id = ?',
          [id]
        );
        
        await this.#db.exec('COMMIT');
        
        return result.changes > 0;
      } catch (error) {
        await this.#db.exec('ROLLBACK');
        throw error;
      }
    });
  }

  async close() {
    return this.#executeQuery(async () => {
      if (this.#db) {
        await this.#db.close();
        this.#db = null;
      }
    });
  }
}

module.exports = DatabaseService;
