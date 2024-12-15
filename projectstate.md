# PIM (Personal Information Management System)

## Project Overview

PIM is an Electron-based desktop application designed for personal information management. It provides a robust system for parsing, storing, and managing personal tasks, meetings, and other information using natural language processing.

## Architecture

### Core Components

1. **Main Process** (`src/main.js`)
   - Handles application lifecycle
   - Manages window creation
   - Coordinates IPC communication
   - Implements menu functionality
   - Manages settings and configuration
   - Handles data persistence

2. **Database Service** (`src/services/database.js`)
   - SQLite-based storage
   - Handles data persistence
   - Manages settings storage
   - Implements backup/restore functionality
   - Supports migrations
   - Handles transaction safety
   - Manages data validation

3. **Parser System** (`src/services/parser/`)
   - Natural language processing
   - Modular plugin architecture
   - Supports multiple parsing strategies
   - Pattern-based text analysis
   - Extensible parsing rules
   - Real-time parsing feedback

4. **Renderer Process** (`src/renderer/`)
   - Modern responsive UI
   - Dynamic component rendering
   - Real-time updates
   - Modal system for forms
   - Settings management interface
   - Entry management interface

### Database Schema

#### Tables

1. **entries**
   - id (PRIMARY KEY)
   - raw_content
   - action
   - contact
   - priority
   - complexity
   - location
   - duration
   - project
   - recurring_pattern
   - final_deadline
   - status
   - created_at
   - updated_at

2. **categories**
   - id (PRIMARY KEY)
   - name (UNIQUE)

3. **entry_categories**
   - entry_id (FOREIGN KEY)
   - category_id (FOREIGN KEY)

4. **settings**
   - key (PRIMARY KEY)
   - value
   - created_at
   - updated_at

### Parser Capabilities

#### Supported Patterns

- Actions (call, email, meet, review, etc.)
- Contacts (@mentions)
- Dates and Times
- Priorities (urgent, high, medium, low)
- Categories (#tags)
- Duration
- Location
- Complexity
- Recurring Patterns
- Time of Day
- Reminders
- Urgency
- Subject
- Attendees
- Project References
- Status Updates
- Zoom Links

## Features

### Core Features

1. Natural Language Input Processing
2. Task Management
3. Contact Management
4. Project Organization
5. Category/Tag System
6. Priority Management
7. Location Tracking
8. Time Management
9. Status Tracking

### Data Management

1. SQLite Database Storage
2. CSV Import/Export
3. Settings Backup/Restore
4. Data Migration Support
5. Transaction Safety
6. Data Validation
7. Error Recovery

### User Interface

1. Main Application Window
2. Settings Management
   - Scrollable Settings Panel
   - Real-time Validation
   - Category Management
   - Parser Configuration
3. Entry Management
   - Table View with Sorting
   - Inline Editing
   - Entry Details Expansion
   - JSON Export
4. Import/Export Functionality
5. Menu System with Shortcuts
6. Modal System
   - Settings Form
   - Entry Form
   - Parser Results Dialog
7. Notification System
   - Success Messages
   - Error Feedback
   - Operation Status

## Configuration

### Parser Configuration

- Pattern definitions
- Plugin system
- Validation rules
- Output formatting
- Custom patterns support

### Application Settings

- Parser settings
- Reminder configurations
- UI preferences
- Data management options
- Time preferences
- Default values

## Dependencies

### Production Dependencies

- electron: ^24.3.0
- chrono-node: ^2.6.3
- marked: ^5.1.1
- sqlite: ^4.1.2
- sqlite3: ^5.1.6
- winston: ^3.10.0

### Development Dependencies

- jest: ^29.7.0

## Project Structure

```bash
src/
├── main.js                 # Main process entry point
├── config/                 # Configuration management
├── plugins/               # Plugin system
├── renderer/              # UI components
│   ├── index.html        # Main HTML template
│   ├── renderer.js       # Renderer process logic
│   └── styles.css        # Application styles
├── scripts/               # Utility scripts
├── services/              # Core services
│   ├── database.js       # Database management
│   ├── logger.js         # Logging service
│   └── parser/           # Text parsing system
└── utils/                # Utility functions
```

## Technical Debt

### Critical

1. Database Encapsulation
   - Migration script directly uses sqlite3 instead of going through DatabaseService
   - Schema information duplicated across files
   - CSV parsing contains database field knowledge
   - Need to consolidate all database operations in DatabaseService
   - Settings storage logic spread across multiple components

2. Configuration Management
   - ConfigManager has direct database knowledge
   - Settings persistence logic mixed with configuration management
   - Need to separate concerns between config and storage

### Required Changes

1. Database Layer Improvements
   - Move all database operations to DatabaseService
   - Encapsulate migration logic within DatabaseService
   - Create data models/interfaces for type safety
   - Remove schema knowledge from non-database files
   - Implement proper data abstraction layer

2. Configuration System Improvements
   ```javascript
   // Separate storage concerns from configuration management
   interface ConfigStorage {
     load(): Promise<Settings>;
     save(settings: Settings): Promise<void>;
   }

   class DatabaseConfigStorage implements ConfigStorage {
     #db: DatabaseService;
     
     constructor(db: DatabaseService) {
       this.#db = db;
     }
     
     async load() {
       return this.#db.getSettings();
     }
     
     async save(settings: Settings) {
       return this.#db.saveSettings(settings);
     }
   }

   class ConfigManager {
     #storage: ConfigStorage;
     
     constructor(storage: ConfigStorage) {
       this.#storage = storage;
     }
     
     async initialize() {
       const stored = await this.#storage.load();
       // Process and validate settings
       // Apply defaults
       // Handle migrations
     }
   }
   ```

### Implementation Plan

1. Database Encapsulation
   ```javascript
   // All database operations should go through DatabaseService
   class DatabaseService {
     // Private schema definitions
     #schema = {
       tables: {
         entries: {
           fields: {
             id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
             raw_content: 'TEXT',
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
             created_at: 'TEXT',
             updated_at: 'TEXT'
           },
           constraints: [
             'PRIMARY KEY (id)'
           ]
         },
         categories: {
           fields: {
             id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
             name: 'TEXT UNIQUE'
           },
           constraints: [
             'PRIMARY KEY (id)',
             'UNIQUE (name)'
           ]
         },
         entry_categories: {
           fields: {
             entry_id: 'INTEGER',
             category_id: 'INTEGER'
           },
           constraints: [
             'PRIMARY KEY (entry_id, category_id)',
             'FOREIGN KEY (entry_id) REFERENCES entries(id) ON DELETE CASCADE',
             'FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE'
           ]
         },
         settings: {
           fields: {
             key: 'TEXT PRIMARY KEY',
             value: 'TEXT',
             created_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
             updated_at: 'DATETIME DEFAULT CURRENT_TIMESTAMP'
           },
           constraints: [
             'PRIMARY KEY (key)'
           ]
         }
       }
     };

     // Public methods with proper data abstraction
     async addEntry(entry) {
       this.#validateEntry(entry);
       const dbEntry = this.#mapToDatabase(entry);
       return this.db.run(`
         INSERT INTO entries (
           raw_content, action, contact, priority,
           complexity, location, duration, project,
           recurring_pattern, final_deadline,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       `, [
         dbEntry.raw_content || null,
         dbEntry.action || null,
         dbEntry.contact || null,
         dbEntry.priority || null,
         dbEntry.complexity || null,
         dbEntry.location || null,
         dbEntry.duration || null,
         dbEntry.project || null,
         dbEntry.recurring_pattern || null,
         dbEntry.final_deadline || null,
         dbEntry.created_at || new Date().toISOString(),
         dbEntry.updated_at || new Date().toISOString()
       ]);
     }

     async getEntries(filters) {
       let query = `
         SELECT e.id, 
                e.raw_content, 
                e.action, 
                e.contact,
                e.priority, 
                e.complexity, 
                e.location, 
                e.duration,
                e.project, 
                e.recurring_pattern, 
                e.final_deadline,
                e.created_at,
                e.updated_at,
                GROUP_CONCAT(c.name) as categories
         FROM entries e
         LEFT JOIN entry_categories ec ON e.id = ec.entry_id
         LEFT JOIN categories c ON ec.category_id = c.id
       `;

       const whereConditions = [];
       const params = [];

       if (filters?.priority?.size > 0) {
         whereConditions.push(`e.priority IN (${Array.from(filters.priority).map(() => '?').join(',')})`);
         params.push(...Array.from(filters.priority));
       }

       if (filters?.date?.size > 0) {
         whereConditions.push(`DATE(e.final_deadline) IN (${Array.from(filters.date).map(() => '?').join(',')})`);
         params.push(...Array.from(filters.date));
       }

       if (filters?.categories?.size > 0) {
         whereConditions.push(`c.name IN (${Array.from(filters.categories).map(() => '?').join(',')})`);
         params.push(...Array.from(filters.categories));
       }

       if (whereConditions.length > 0) {
         query += ' WHERE ' + whereConditions.join(' AND ');
       }

       query += ' GROUP BY e.id';

       if (filters?.sort) {
         const { column, direction } = filters.sort;
         query += `
           ORDER BY 
             CASE WHEN e.${column} IS NULL THEN 1 ELSE 0 END,
             e.${column} ${direction.toUpperCase()}
         `;
       }

       return this.db.all(query, params);
     }
     
     async migrate() {
       await this.db.exec('PRAGMA foreign_keys = ON');
       
       for (const [tableName, schema] of Object.entries(this.#schema.tables)) {
         const fields = Object.entries(schema.fields)
           .map(([name, type]) => `${name} ${type}`)
           .join(',\n');
         
         const constraints = schema.constraints.join(',\n');
         
         await this.db.exec(`
           CREATE TABLE IF NOT EXISTS ${tableName} (
             ${fields}${constraints ? ',\n' + constraints : ''}
           )
         `);
       }
     }
   }
   ```

2. Data Models
   ```javascript
   interface Entry {
     id?: number;
     rawContent: string;
     action?: string;
     contact?: string;
     priority?: string;
     complexity?: string;
     location?: string;
     duration?: number;
     project?: string;
     recurringPattern?: string;
     finalDeadline?: string;
     status?: string;
     createdAt?: string;
     updatedAt?: string;
     categories?: string[];
   }

   interface EntryFilters {
     priority?: Set<string>;
     date?: Set<string>;
     categories?: Set<string>;
     sort?: {
       column: 'final_deadline' | 'priority' | 'created_at';
       direction: 'asc' | 'desc';
     };
   }

   interface Settings {
     parser: {
       maxDepth: number;
       ignoreFiles: string[];
       outputFormat: 'json' | 'text';
       tellTruth: boolean;
     };
     reminders: {
       defaultMinutes: number;
       allowMultiple: boolean;
     };
   }
   ```

3. Service Layer
   ```javascript
   class EntryService {
     #db: DatabaseService;
     #parser: Parser;
     
     constructor(db: DatabaseService, parser: Parser) {
       this.#db = db;
       this.#parser = parser;
     }
     
     async addEntry(content: string) {
       const parseResults = await this.#parser.parse(content);
       const now = new Date().toISOString();
       
       const entry = {
         rawContent: content,
         createdAt: now,
         updatedAt: now,
         action: parseResults.parsed.action || '',
         contact: parseResults.parsed.contact || '',
         project: parseResults.parsed.project?.project || '',
         finalDeadline: parseResults.parsed.final_deadline || '',
         priority: parseResults.parsed.priority || '',
         status: parseResults.parsed.status?.progress || ''
       };
       
       return this.#db.addEntry(entry);
     }

     async getEntries(filters: EntryFilters) {
       return this.#db.getEntries(filters);
     }
   }

   class SettingsService {
     #db: DatabaseService;
     #configManager: ConfigManager;
     
     constructor(db: DatabaseService, configManager: ConfigManager) {
       this.#db = db;
       this.#configManager = configManager;
     }
     
     async getSettings(): Promise<Settings> {
       const parserConfig = this.#configManager.get('parser');
       const remindersConfig = this.#configManager.get('reminders');
       
       return {
         parser: {
           maxDepth: parserConfig.maxDepth,
           ignoreFiles: parserConfig.ignoreFiles,
           outputFormat: parserConfig.outputFormat,
           tellTruth: parserConfig.tellTruth
         },
         reminders: {
           defaultMinutes: remindersConfig.defaultMinutes,
           allowMultiple: remindersConfig.allowMultiple
         }
       };
     }
   }
   ```

### Benefits

1. Improved Maintainability
   - Single source of truth for database schema
   - Easier to modify database structure
   - Better error handling
   - Cleaner code organization
   - Clear separation of concerns

2. Better Testing
   - Easier to mock database operations
   - Clearer test boundaries
   - More reliable tests
   - Isolated configuration testing

3. Enhanced Security
   - Better input validation
   - Proper data sanitization
   - Controlled data access
   - Secure settings management

4. Improved Reliability
   - Consistent data handling
   - Better error recovery
   - Proper transaction management
   - Reliable configuration state

### Timeline

1. Phase 1: Database Encapsulation
   - Move all database operations to DatabaseService
   - Update migration system
   - Add proper error handling
   - Consolidate settings storage

2. Phase 2: Configuration System
   - Implement ConfigStorage interface
   - Create DatabaseConfigStorage
   - Update ConfigManager
   - Add configuration validation

3. Phase 3: Data Models
   - Create proper interfaces
   - Implement validation
   - Add type safety
   - Define settings schema

4. Phase 4: Service Layer
   - Implement Repository pattern
   - Add service abstractions
   - Update IPC handlers
   - Separate storage concerns

5. Phase 5: Testing
   - Add unit tests
   - Implement integration tests
   - Add migration tests
   - Test configuration system
