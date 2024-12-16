# PIM (Personal Information Management System)

## Project Overview

PIM is an Electron-based desktop application designed for personal information management. It provides a robust system for parsing, storing, and managing personal tasks, meetings, and other information using natural language processing.

This project does not use typescript and does not want to use typescript.

Note: Whenever 'projectstate.md' is updated, also update 'readme.md' and 'usermanual.md'.

## Dependencies

### Core Dependencies

- electron: ^24.3.0
- chrono-node: ^2.6.3
- marked: ^5.1.1
- uuid: ^9.0.1
- winston: ^3.10.0

### Development Dependencies

- jest: ^29.7.0

## System Architecture

### 1. Main Process (`src/main.js`)

- Handles application lifecycle
- Manages window creation
- Coordinates IPC communication
- Implements menu functionality
- Manages settings and configuration
- Handles data persistence

### 2. Storage System

#### Service Implementation (`src/services/json-database.js`)

- JSON-based storage implementation
- Direct parser output storage
- Handles data persistence
- Manages settings storage
- Implements backup/restore functionality
- Handles transaction-like operations
- Manages data validation

#### Data Structure

```javascript
{
  "entries": [
    {
      "id": "uuid",
      "created_at": "ISO string",
      "updated_at": "ISO string",
      "raw_content": "string",
      "parsed": {
        "action": "string",
        "contact": "string",
        "project": {
          "project": "string"
        },
        "final_deadline": "ISO string",
        "status": "string",
        "categories": []
      },
      "plugins": {}
    }
  ],
  "settings": {
    "key": "value"
  },
  "meta": {
    "version": "string",
    "last_backup": "ISO string"
  }
}
```

#### Data Management Features

- JSON Import/Export
- Settings Backup/Restore
- Transaction-like Operations
- Data Validation
- Error Recovery
- Plugin Data Support

### 3. Parser System (`src/services/parser/`)

#### Core Functionality

- Natural language processing
- Modular plugin architecture
- Multiple parsing strategies support
- Pattern-based text analysis
- Extensible parsing rules
- Real-time parsing feedback

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

#### Configuration

- Pattern definitions
- Plugin system
- Validation rules
- Output formatting
- Custom patterns support

### 4. User Interface System (`src/renderer/`)

#### Core Components

- Modern responsive UI
- Dynamic component rendering
- Real-time updates
- Modal system for forms
- Settings management interface
- Entry management interface

#### Interface Features

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

## Configuration System

### Application Settings

- Parser settings
- Reminder configurations
- UI preferences
- Data management options
- Time preferences
- Default values

## Core Features

1. Natural Language Input Processing
2. Task Management
3. Contact Management
4. Project Organization
5. Category/Tag System
6. Priority Management
7. Location Tracking
8. Time Management
9. Status Tracking

## Project Structure

```bash
/Users/tomcranstoun/Documents/GitHub/pim/src
├── .DS_Store
├── config
│   ├── ConfigManager.js
│   └── parser.config.js
├── main.js
├── plugins
│   ├── customPlugin.js
│   ├── locationPlugin.js
│   └── pluginManager.js
├── renderer
│   ├── index.html
│   ├── renderer.js
│   └── styles.css
├── services
│   ├── config.js
│   ├── json-database.js
│   ├── entry-service.js
│   ├── logger.js
│   ├── parser
│   │   ├── core.js
│   │   ├── formatters
│   │   │   └── emoji.js
│   │   ├── index.js
│   │   ├── parsers
│   │   │   ├── action.js
│   │   │   ├── attendees.js
│   │   │   ├── categories.js
│   │   │   ├── complexity.js
│   │   │   ├── contact.js
│   │   │   ├── date.js
│   │   │   ├── dependencies.js
│   │   │   ├── duration.js
│   │   │   ├── links.js
│   │   │   ├── location.js
│   │   │   ├── priority.js
│   │   │   ├── project.js
│   │   │   ├── recurring.js
│   │   │   ├── reminders.js
│   │   │   ├── status.js
│   │   │   ├── subject.js
│   │   │   ├── time.js
│   │   │   ├── timeOfDay.js
│   │   │   └── urgency.js
│   │   └── utils
│   │       ├── dateUtils.js
│   │       ├── patterns.js
│   │       ├── timeUtils.js
│   │       └── validation.js
│   └── parser.js
└── utils
    ├── dateUtils.js
    └── logger.js
