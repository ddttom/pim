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
- sqlite: ^4.1.2
- sqlite3: ^5.1.6
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

### 2. Database System

#### Service Implementation (`src/services/database.js`)

- SQLite-based storage implementation
- Handles data persistence
- Manages settings storage
- Implements backup/restore functionality
- Supports migrations
- Handles transaction safety
- Manages data validation

#### Schema

**Tables:**

1. entries
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

2. categories
   - id (PRIMARY KEY)
   - name (UNIQUE)

3. entry_categories
   - entry_id (FOREIGN KEY)
   - category_id (FOREIGN KEY)

4. settings
   - key (PRIMARY KEY)
   - value
   - created_at
   - updated_at

#### Data Management Features

- CSV Import/Export
- Settings Backup/Restore
- Data Migration Support
- Transaction Safety
- Data Validation
- Error Recovery

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
