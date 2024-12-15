# PIM (Personal Information Management System)

## Project Overview

PIM is an Electron-based desktop application designed for personal information management. It provides a robust system for parsing, storing, and managing personal tasks, meetings, and other information using natural language processing.

This project does use typescript, doe not want to use typescript

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

### Resolved Items

1. ✅ Database Encapsulation
   - ✅ Migration script now uses DatabaseService
   - ✅ Schema information consolidated in DatabaseService
   - ✅ All database operations go through DatabaseService
   - ✅ Added proper error handling and validation
   - ✅ Implemented query safety with parameter binding

2. ✅ Configuration Management
   - ✅ Separated storage concerns from configuration management
   - ✅ Implemented proper ConfigManager with storage abstraction
   - ✅ Added settings validation and defaults
   - ✅ Proper error handling for config operations

### Current Technical Debt

1. Parser System Improvements
   - Add JSDoc documentation for parser interfaces
   - Improve plugin system error handling
   - Add validation for parser results
   - Implement parser result caching
   - Add unit tests for all parser components
   ```javascript
   /**
    * @typedef {Object} ParserPlugin
    * @property {string} name - Plugin name
    * @property {function(string): Promise<ParseResult>} parse - Parse function
    * @property {function(ParseResult): boolean} validate - Validation function
    */

   /**
    * @typedef {Object} ParseResult
    * @property {string} raw_content - Original text
    * @property {Object} parsed - Parsed data
    * @property {string} [parsed.action] - Action type
    * @property {string} [parsed.contact] - Contact name
    * @property {('high'|'medium'|'low')} [parsed.priority] - Priority level
    * @property {Object} [parsed.location] - Location information
    * @property {Object} [parsed.duration] - Duration information
    * @property {Object} [parsed.project] - Project information
    * @property {string} [parsed.status] - Status information
    * @property {Object} plugins - Plugin results
    */
   ```

2. IPC Communication Layer
   - Implement proper request/response patterns
   - Add validation middleware
   - Add error handling middleware
   - Add retry logic for failed operations
   ```javascript
   /**
    * @typedef {Object} IpcRequest
    * @property {string} type - Request type
    * @property {*} payload - Request payload
    * @property {string} requestId - Unique request ID
    */

   /**
    * @typedef {Object} IpcResponse
    * @property {boolean} success - Success status
    * @property {*} [data] - Response data
    * @property {Object} [error] - Error information
    * @property {string} error.code - Error code
    * @property {string} error.message - Error message
    * @property {*} [error.details] - Additional error details
    */

   class IpcHandler {
     /**
      * Handle IPC request
      * @param {IpcRequest} request - Request object
      * @returns {Promise<IpcResponse>}
      */
     async handle(request) {
       // Implementation
     }

     /**
      * Validate request
      * @param {IpcRequest} request
      * @returns {boolean}
      */
     validate(request) {
       // Implementation
     }
   }
   ```

3. Error Handling System
   - Create custom error classes
   - Add error reporting system
   - Implement error recovery strategies
   - Add error logging with context
   ```javascript
   class AppError extends Error {
     /**
      * @param {string} message - Error message
      * @param {string} code - Error code
      * @param {Object} [context] - Error context
      */
     constructor(message, code, context = {}) {
       super(message);
       this.code = code;
       this.context = context;
     }
   }

   class DatabaseError extends AppError {
     /**
      * @param {string} message - Error message
      * @param {string} operation - Database operation
      * @param {string} [query] - SQL query
      */
     constructor(message, operation, query) {
       super(message, 'DATABASE_ERROR', { operation, query });
     }
   }
   ```

### Implementation Plan

1. Phase 1: Parser System Improvements
   - Add JSDoc documentation
   - Implement validation
   - Add caching
   - Write tests
   - Add error handling

2. Phase 2: IPC Layer Enhancement
   - Create request/response patterns
   - Add validation
   - Create middleware
   - Add retry logic
   - Add IPC logging

3. Phase 3: Error Handling System
   - Create error classes
   - Implement reporting
   - Add recovery
   - Enhance logging
   - Add error monitoring

### Benefits

1. Improved Code Documentation
   - Better development experience
   - Clear function signatures
   - Improved code documentation
   - Better IDE support through JSDoc

2. Enhanced Reliability
   - Better error handling
   - Proper validation
   - Improved recovery strategies
   - Better monitoring

3. Better Maintainability
   - Clear interfaces
   - Consistent error handling
   - Better logging
   - Easier debugging

### Timeline

1. Week 1-2: Parser System
   - Add JSDoc documentation
   - Implement validation
   - Add caching
   - Write tests
   - Add error handling

2. Week 3-4: IPC Layer
   - Create request/response patterns
   - Add validation
   - Create middleware
   - Add retry logic

3. Week 5-6: Error Handling
   - Create error classes
   - Implement reporting
   - Add recovery
   - Enhance logging
   - Add error monitoring

### Testing Strategy

1. Unit Tests
   - Parser plugins
   - IPC handlers
   - Error handling
   - Configuration system

2. Integration Tests
   - Parser system
   - IPC communication
   - Database operations
   - Error recovery

3. End-to-End Tests
   - Complete workflows
   - Error scenarios
   - Recovery processes
   - Performance testing

### Monitoring Plan

1. Error Tracking
   - Implement error reporting
   - Add error analytics
   - Create error dashboards
   - Set up alerts

2. Performance Monitoring
   - Track parser performance
   - Monitor IPC latency
   - Database operation timing
   - Resource usage tracking

3. Usage Analytics
   - Track feature usage
   - Monitor error rates
   - Analyze user patterns
   - Measure performance metrics
