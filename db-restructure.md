# Technical Debt

## Make a plan to fix all of thes problem/issues

### Critical

1. Database Encapsulation
   - Migration script directly uses sqlite3 instead of going through DatabaseService
   - Schema information is duplicated across files
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
       // ... rest of initialization
     }
   }
   ```

3. Architectural Improvements
   - Implement Repository pattern for data access
   - Create proper data models/DTOs
   - Add service layer between UI and database
   - Implement proper dependency injection
   - Separate storage concerns from business logic

4. Code Organization
   - Move CSV parsing logic to dedicated service
   - Create proper interfaces for data structures
   - Implement proper error boundaries
   - Add input validation layer
   - Separate configuration from storage

### Implementation Plan

1. Database Encapsulation

   ```javascript
   // All database operations should go through DatabaseService
   class DatabaseService {
     // Private schema definitions
     #schema = {
       tables: {
         entries: {
           fields: [...],
           constraints: [...]
         },
         settings: {
           fields: [...],
           constraints: [...]
         }
       }
     };

     // Public methods with proper data abstraction
     async addEntry(entry) { ... }
     async getEntries(filters) { ... }
     async updateEntry(entry) { ... }
     async deleteEntry(id) { ... }
     
     // Settings-specific methods
     async getSettings() { ... }
     async saveSettings(settings) { ... }
     
     // Migration handling
     async migrate() { ... }
     
     // Private helper methods
     #validateEntry(entry) { ... }
     #validateSettings(settings) { ... }
     #mapToDatabase(data) { ... }
     #mapFromDatabase(record) { ... }
   }
   ```

2. Data Models

   ```javascript
   // Define proper interfaces/types
   interface Entry {
     id?: number;
     rawContent: string;
     action?: string;
     contact?: string;
     // ... other fields
   }

   interface Settings {
     parser: ParserSettings;
     reminders: ReminderSettings;
     // ... other settings
   }

   interface EntryFilters {
     priority?: string[];
     status?: string[];
     // ... other filter fields
   }
   ```

3. Service Layer

   ```javascript
   class EntryService {
     #db: DatabaseService;
     
     constructor(db: DatabaseService) {
       this.#db = db;
     }
     
     async addEntry(entry: Entry) {
       // Validate
       // Transform
       // Store
       return this.#db.addEntry(entry);
     }
   }

   class SettingsService {
     #db: DatabaseService;
     #configManager: ConfigManager;
     
     constructor(db: DatabaseService, configManager: ConfigManager) {
       this.#db = db;
       this.#configManager = configManager;
     }
     
     async getSettings() {
       // Get from config manager
       // Apply any runtime modifications
       // Return settings
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
