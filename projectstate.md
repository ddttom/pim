# Personal Information Manager (PIM) Project State

## Overview

The project is a Personal Information Manager (PIM) with natural language parsing capabilities. The application is built using Electron for the desktop interface. The system aims to:
- Provide intuitive task and information management through natural language input
- Offer flexible organization through automatic parsing and categorization
- Support extensibility through a plugin-based architecture
- Maintain high performance and reliability for daily use
- Ensure data security and privacy

## Core Architecture

- Electron for cross-platform desktop application
- Modern JavaScript (ES2022+) for UI implementation, never use typescript, never use react
- SQLite for persistent local storage

### Core Dependencies
- electron (^22.0.0)
- sqlite3 (^5.0.0)
- winston (^3.8.0) for logging
- chrono-node (^2.3.0) for date parsing
- electron-store (^8.1.0) for settings management
- electron-builder (^23.6.0) for packaging

## Current State

### Core Components

#### Parser System
- Located in `src/services/parser/`
- Uses a plugin-based architecture for extensibility
- Plugin system features:
  - Dynamic plugin loading
  - Custom plugin development support
  - Plugin configuration management
  - Plugin event handling
  - Hot-reloading capabilities
  - Plugin dependency resolution
  - Plugin lifecycle management
  - Error isolation and recovery
- Handles various input patterns including:
  - Actions (call, email, meet, review, text)
  - Dates and times
  - Contacts
  - Projects
  - Priorities
  - Locations
  - Reminders
- Each entry includes:
  - Entry date (automatically set to now())
  - Raw content
  - Parsed components
  - Metadata
  - Validation status
  - Processing history
  - Error information

#### Settings System
Currently implementing a settings management system with:
- Modal-based settings UI
- Configuration for:
  - Time periods (morning, afternoon, evening)
  - Default times for different actions
  - Default reminder intervals
  - Status management
- Implementation details:
  - Settings persistence in SQLite
  - Real-time settings updates
  - Settings validation
  - Default value management
  - User preference handling

### Current Issues

#### Settings Form
1. Duplicate form content appearing in the settings modal
2. Settings retrieval from main process not working correctly
3. Form structure needs cleanup to prevent nesting issues

#### Configuration Management
Need to properly sync between:
- Parser configuration
- UI settings
- Stored preferences

### Next Steps

1. Fix Settings Form
   - Remove duplicate modal content
   - Ensure proper data flow between main and renderer
   - Clean up form structure

2. Configuration Integration
   - Integrate parser patterns with settings UI
   - Add validation for settings values
   - Implement proper save/load functionality

3. UI Improvements
   - Add proper error handling and user feedback
   - Improve form layout and responsiveness
   - Add input validation

## Implementation Details

### Features to Implement

#### Data Entry System
- Natural language input processing, markdown text or plain text, using a rich text box input
- File attachment support
- Image import with metadata
- **New Entry Form**: A form is available to add new entries directly into the application
- **Entry Display**: Newly added entries are displayed in a list within the application
- **Text Analysis**: Entries are analyzed for actions, objects, and timescales using regex-based parsing
- **Entry Table View**: Entries are displayed in a table with columns for text, actions, objects, and timescales
- **Enhanced Timescale Parsing**: Timescales like "next Wednesday" or "last Wednesday" are calculated to specific dates
- **JSON Logging**: New entries are logged in JSON format for verification and debugging

#### Data Organization
- Priority system (None, Low, Medium, High, Urgent)
- Multiple date types (due, start, end, scheduled, completed)
- Categories and tags
- Bi-directional linking
- Custom metadata fields

#### View System
- Tab-based interface
- Customizable columns
- Multiple layouts (table, card, timeline, calendar, network)
- Column sorting and visibility
- View saving and sharing
- Print view functionality

#### Filter System
- Smart date filters ("without date", "due this week", etc.)
- Priority filters
- Category filters
- Combined conditions
- Filter presets
- Custom filter ranges

#### Tab Management
- Multiple simultaneous views
- State persistence
- Tab-specific filters
- History tracking
- Quick switching

#### Print System
- Multiple formats (detailed, compact, list, summary)
- Paper size options
- Content inclusion toggles
- Headers and footers
- Custom styling

#### Menu System
- File Menu: New Entry, Open, Save, Print, Quit
- Edit Menu: Undo, Redo, Cut, Copy, Paste
- View Menu: Toggle Full Screen, Reload
- Help Menu: About

### Technical Implementation

#### Natural Language Parser
```javascript
interface ParsedEntry {
  rawContent: string;
  action?: string;       // "call"
  contact?: string;      // "Linda"
  datetime?: Date;       // Next Friday's date
  categories: string[];  // ["calls", "contacts", "tasks"]
  links: Link[];        // Link to Linda's contact entry
  validation: {         // Added validation information
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  metadata: {           // Added metadata
    createdAt: Date;
    updatedAt: Date;
    version: string;
    parser: string;
  };
}

class NaturalLanguageParser {
  parse(text: string): ParsedEntry {
    try {
      // Parse using regex and NLP
      const patterns = {
        action: /^(call|email|meet|review)/i,
        contact: /\b[A-Z][a-z]+\b/,
        timeExpression: /(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
      };

      // Process datetime using library like chrono-node
      const datetime = chronoParser.parseDate(text);
      
      // Extract entities and create links/categories
      const result = {
        rawContent: text,
        validation: {
          isValid: true,
          errors: [],
          warnings: []
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
          parser: 'core'
        }
      };

      // Validate result
      this.validateResult(result);
      
      return result;
    } catch (error) {
      this.handleError(error);
    }
  }

  validateResult(result: ParsedEntry): void {
    // Implement validation logic
  }

  handleError(error: Error): void {
    // Implement error handling
  }

  suggestCategories(parsed: ParsedEntry): string[] {
    // Rule-based category suggestion
  }

  suggestLinks(parsed: ParsedEntry): Link[] {
    // Generate relevant links based on parsed entities
  }
}
```

#### Date Parser
```javascript
interface TimeExpression {
  type: 'relative' | 'absolute';
  unit: 'day' | 'week' | 'month' | 'quarter' | 'year';
  modifier: 'next' | 'last' | 'this';
  dayOfWeek?: number;
  value?: number;
  validation?: {
    isValid: boolean;
    errors: string[];
  };
}

class DateParser {
  private patterns = {
    relativeDay: /(next|last|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    relativePeriod: /(next|last|this)\s+(month|quarter|year)/i,
    specificDate: /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i
  };

  parseTimeExpression(text: string): TimeExpression {
    try {
      const dayMatch = text.match(this.patterns.relativeDay);
      if (dayMatch) {
        return {
          type: 'relative',
          unit: 'day',
          modifier: dayMatch[1].toLowerCase(),
          dayOfWeek: this.getDayNumber(dayMatch[2]),
          validation: {
            isValid: true,
            errors: []
          }
        };
      }

      const periodMatch = text.match(this.patterns.relativePeriod);
      if (periodMatch) {
        return {
          type: 'relative',
          unit: periodMatch[2].toLowerCase(),
          modifier: periodMatch[1].toLowerCase(),
          validation: {
            isValid: true,
            errors: []
          }
        };
      }

      return {
        type: 'absolute',
        unit: 'day',
        modifier: 'this',
        validation: {
          isValid: false,
          errors: ['Unable to parse time expression']
        }
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  calculateDate(expr: TimeExpression): Date {
    try {
      const now = new Date();
      let result = new Date(now);

      switch(expr.unit) {
        case 'day':
          result = this.calculateRelativeDay(expr.modifier, expr.dayOfWeek);
          break;
        case 'month':
          result = this.calculateRelativePeriod(expr.modifier, 'month');
          break;
        case 'quarter':
          result = this.calculateRelativePeriod(expr.modifier, 'quarter');
          break;
        case 'year':
          result = this.calculateRelativePeriod(expr.modifier, 'year');
          break;
      }

      return result;
    } catch (error) {
      this.handleError(error);
      return new Date();
    }
  }

  private handleError(error: Error): void {
    // Implement error handling
    console.error('DateParser Error:', error);
    // Log error to monitoring system
  }
}
```

### Code Structure and Best Practices
- Add proper class-based structure following Airbnb style guide
- Group related configuration options into config objects
- Use Set for activeFilters to prevent duplicates
- Add support for combined filter conditions
- Improve HTML structure with wrapper classes
- Add proper event handling

### Architecture Guidelines
- Follow modern javascript best practices, never use react
- Implement proper error handling
- Follow the repository pattern for data access
- Implement service layer for business logic
- Use dependency injection where appropriate
- Follow event-driven architecture for updates
- Implement proper logging and monitoring, using WINSTON

### Settings Management Implementation
- Implement modal-based settings UI
- Handle settings synchronization between components
- Prevent duplicate form content issues
- Ensure proper data flow between main and renderer processes
- Implement proper form structure and validation
- Add comprehensive error handling
- Provide user feedback for settings changes

### Application Behavior
- Application lifecycle management:
  - Proper window management
  - App quits when all windows are closed (all platforms)
  - State persistence between sessions
  - Proper cleanup on exit
- Settings management:
  - Settings persistence between sessions
  - Real-time settings updates
  - Configuration change handling
  - Settings synchronization
- Error handling:
  - Graceful error recovery
  - User-friendly error messages
  - Error logging and reporting
- Performance optimization:
  - Efficient resource usage
  - Proper memory management
  - Background task handling

## File Structure

```bash
src/
├── main.js                 # Main process
├── renderer/
│   ├── index.html         # Main UI
│   ├── renderer.js        # Renderer process
│   └── styles.css         # UI styles
├── services/
│   ├── database.js        # Data persistence
│   └── parser/
│       ├── core.js        # Parser core
│       ├── parsers/       # Individual parsers
│       └── utils/         # Parser utilities
└── utils/
    ├── dateUtils.js       # Date handling
    └── logger.js          # Logging system
```

## Requirements

### Performance Requirements
- Application startup < 3 seconds
- Search response time < 500ms
- Smooth scrolling at 60fps
- Memory usage < 500MB
- Efficient data caching
- Batch operations for bulk changes

### Error Handling
- Implement comprehensive error catching
- User-friendly error messages
- Error logging system
- Automatic error recovery where possible
- Crash reporting System

### Plugin System Requirements
- Dynamic plugin loading/unloading
- Plugin isolation
- Resource cleanup
- Error containment
- Performance monitoring
- Configuration management

## Current Focus
Working on the settings management system to provide a user-friendly interface for configuring the application's behavior, particularly focusing on the natural language parser's patterns and default values.

## Development Guidelines

### Code Quality
- Follow Airbnb style guide
- Maintain comprehensive documentation
- Write unit tests for all components
- Perform code reviews
- Use consistent naming conventions
- Implement proper error handling
- Follow SOLID principles

### Performance Optimization
- Implement lazy loading where appropriate
- Use efficient data structures
- Optimize database queries
- Implement proper caching
- Monitor memory usage
- Profile performance regularly

### Security Considerations
- Validate all user input
- Sanitize data before storage
- Implement proper access controls
- Follow security best practices
- Regular security audits
- Secure data storage
