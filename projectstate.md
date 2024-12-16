# PIM (Personal Information Management System)

## Project Overview

PIM is an Electron-based desktop application designed for personal information management. It provides a robust system for parsing, storing, and managing personal tasks, meetings, and other information using natural language processing.

This project does not use typescript, does not want to use typescript

whenever this file, 'projectstate.md', is updated also update 'readme.md' and 'usermanual.md'

## Current Status

### Latest Test Results (2024-12-16)

Parser Tests: 31/33 passing (93.9%)
Failing Tests:
1. Project Parsing - Multi-word Names
   ```
   Expected: "Big Launch"
   Received: "Big"
   Location: tests/parser.test.js:256
   ```

2. Contact Parsing - Common Words
   ```
   Expected: undefined
   Received: null
   Location: tests/parser.test.js:273
   ```

Test Categories:
- ✅ Status Parsing (6/6)
- ✅ Date Parsing (3/3)
- ✅ Action Parsing (4/4)
- ⚠️ Project Parsing (2/3)
- ⚠️ Contact Parsing (2/3)
- ✅ Full Text Parsing (3/3)
- ✅ Config Tests (11/11)

### Priority Fixes

1. Project Parsing
   - Fix regex pattern to capture full multi-word project names
   - Current pattern: `/project\s+([A-Z][a-zA-Z\s]+?)(?=\s|$)/i`
   - Issue: Not properly capturing space-separated words
   - Test case: "about project Big Launch"

2. Contact Parsing
   - Standardize return value for no contact (null vs undefined)
   - Update common word filtering
   - Test case: "Call me later"

### Recently Fixed Issues

1. Parser System
   - Fixed null/undefined input handling
   - Added proper status parsing (None, Blocked, Complete, etc.)
   - Fixed date parsing for "next week" and 9 AM default
   - Added 'text' to supported actions
   - Improved contact detection with "with" keyword

### Known Issues

1. Parser Edge Cases
   - Multi-word project names not fully captured
   - Contact parsing returning null instead of undefined
   - Project names with special characters need handling

2. UI/UX Issues
   - Parse button visibility needs improvement
   - Toggle entry detail JSON not working correctly
   - Mac OS red close button behavior needs refinement

### Technical Debt

1. Parser System
   - Add more comprehensive test coverage
   - Improve error messages
   - Add validation for parsed results
   - Consider adding custom date formats
   - Need better handling of ambiguous inputs

2. Database Operations
   - Add transaction rollback tests
   - Improve error handling
   - Add data validation
   - Consider adding migrations
   - Add backup/restore functionality

3. Configuration Management
   - Add validation for settings
   - Improve default values
   - Add import/export functionality
   - Add user preferences

### Test Results

1. Parser Tests Status
   - ✅ Status parsing (all cases pass)
   - ✅ Basic action parsing
   - ✅ Empty/null input handling
   - ❌ Multi-word project names need fixing
   - ❌ Contact parsing after "with" needs improvement
   - ❌ Common word filtering needs refinement

2. Database Tests
   - ✅ Basic CRUD operations
   - ✅ Transaction handling
   - ✅ Error handling
   - Need more coverage for:
     - Edge cases
     - Concurrent operations
     - Data validation

### Next Steps

1. Priority Fixes
   - Improve contact parsing accuracy
   - Fix multi-word project handling
   - Add better common word filtering
   - Implement proper date/time handling

2. Feature Additions
   - Add recurring task support
   - Implement categories
   - Add priority levels
   - Add reminders

3. Testing
   - Add integration tests
   - Increase unit test coverage
   - Add end-to-end tests
   - Add performance tests

## Dependencies

- electron: ^24.3.0
- chrono-node: ^2.6.3
- marked: ^5.1.1
- sqlite: ^4.1.2
- sqlite3: ^5.1.6
- winston: ^3.10.0

## Development Dependencies

- jest: ^29.7.0

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
