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

2. **Database Service** (`src/services/database.js`)
   - SQLite-based storage
   - Handles data persistence
   - Manages settings storage
   - Implements backup/restore functionality
   - Supports migrations

3. **Parser System** (`src/services/parser/`)
   - Natural language processing
   - Modular plugin architecture
   - Supports multiple parsing strategies
   - Pattern-based text analysis
   - Extensible parsing rules

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

### User Interface

1. Main Application Window
2. Settings Management
3. Import/Export Functionality
4. Menu System with Shortcuts

## Configuration

### Parser Configuration

- Pattern definitions
- Plugin system
- Validation rules
- Output formatting

### Application Settings

- Parser settings
- Reminder configurations
- UI preferences
- Data management options

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
├── scripts/               # Utility scripts
├── services/              # Core services
│   ├── database.js       # Database management
│   ├── logger.js         # Logging service
│   └── parser/           # Text parsing system
└── utils/                # Utility functions
```

## Current State

### Implemented Features

- Basic application structure
- Database implementation
- Natural language parsing
- Settings management
- Import/Export functionality
- Plugin system
- Logging system

### Pending Features

- Enhanced UI/UX
- Advanced search capabilities
- Data visualization
- Collaboration features
- Cloud synchronization
- Mobile integration

## Testing

### Test Coverage

- Parser tests
- Plugin tests
- Database mocks
- Logger mocks

### Testing Tools

- Jest test framework
- Mock implementations
- Integration tests

## Future Considerations

### Planned Improvements

1. Enhanced parsing capabilities
2. Advanced UI features
3. Better data visualization
4. Improved search functionality
5. Cloud integration
6. Mobile companion app
7. Collaboration features
8. API integration

### Technical Debt

1. Comprehensive error handling
2. Performance optimization
3. Code documentation
4. Test coverage expansion
5. UI/UX refinement
