# Personal Information Management System

## Core Architecture

- Electron for cross-platform desktop application
- Modern JavaScript (ES2022+) for UI implementation, never use typescript, never use react
- SQLite for persistent local storage

## Core Dependencies

electron
sqlite3

## Key Features to Implement

### Data Entry System

- Natural language input processing, markdown text or plain text, using a rich text box input
- File attachment support
- Image import with metadata
- **New Entry Form**: A form is available to add new entries directly into the application.
- **Entry Display**: Newly added entries are displayed in a list within the application.
- **Text Analysis**: Entries are analyzed for actions, objects, and timescales using regex-based parsing.
- **Entry Table View**: Entries are displayed in a table with columns for text, actions, objects, and timescales.
- **Enhanced Timescale Parsing**: Timescales like "next Wednesday" or "last Wednesday" are calculated to specific dates.
- **JSON Logging**: New entries are logged in JSON format for verification and debugging.

### Data Organization

- Priority system (None, Low, Medium, High, Urgent)
- Multiple date types (due, start, end, scheduled, completed)
- Categories and tags
- Bi-directional linking
- Custom metadata fields

### View System

- Tab-based interface
- Customizable columns
- Multiple layouts (table, card, timeline, calendar, network)
- Column sorting and visibility
- View saving and sharing
- Print view functionality

### Filter System

- Smart date filters ("without date", "due this week", etc.)
- Priority filters
- Category filters
- Combined conditions
- Filter presets
- Custom filter ranges

### Tab Management

- Multiple simultaneous views
- State persistence
- Tab-specific filters
- History tracking
- Quick switching

### Print System

- Multiple formats (detailed, compact, list, summary)
- Paper size options
- Content inclusion toggles
- Headers and footers
- Custom styling

### Menu System

- File Menu: New Entry, Open, Save, Print, Quit
- Edit Menu: Undo, Redo, Cut, Copy, Paste
- View Menu: Toggle Full Screen, Reload
- Help Menu: About

## Implementation Requirements

Create a dialog box that allows input of natural language, allowing markdown syntax.  In the input phase inspect the input object for textual clues for items such as 'next wednesday' , 'wednesday' , 'last wednesday of the month', 'last wednesday' 'next month', 'next year'.

Each input object has an attribute entry date, which is now();

the input object should be parsed similar to

interface ParsedEntry {
  rawContent: string;
  action?: string;       // "call"
  contact?: string;      // "Linda"
  datetime?: Date;       // Next Friday's date
  categories: string[];  // ["calls", "contacts", "tasks"]
  links: Link[];        // Link to Linda's contact entry
}

class NaturalLanguageParser {
  parse(text: string): ParsedEntry {
    // Parse using regex and NLP
    const patterns = {
      action: /^(call|email|meet|review)/i,
      contact: /\b[A-Z][a-z]+\b/,
      timeExpression: /(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
    };

    // Process datetime using library like chrono-node
    const datetime = chronoParser.parseDate(text);
    
    // Extract entities and create links/categories
    return {
      rawContent: text,
      // ... parsed components
    };
  }

  suggestCategories(parsed: ParsedEntry): string[] {
    // Rule-based category suggestion
  }

  suggestLinks(parsed: ParsedEntry): Link[] {
    // Generate relevant links based on parsed entities
  }
}

Extend time expressions

interface TimeExpression {
  type: 'relative' | 'absolute';
  unit: 'day' | 'week' | 'month' | 'quarter' | 'year';
  modifier: 'next' | 'last' | 'this';
  dayOfWeek?: number;
  value?: number;
}

class DateParser {
  private patterns = {
    relativeDay: /(next|last|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    relativePeriod: /(next|last|this)\s+(month|quarter|year)/i,
    specificDate: /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i
  };

  parseTimeExpression(text: string): TimeExpression {
    const dayMatch = text.match(this.patterns.relativeDay);
    if (dayMatch) {
      return {
        type: 'relative',
        unit: 'day',
        modifier: dayMatch[1].toLowerCase(),
        dayOfWeek: this.getDayNumber(dayMatch[2])
      };
    }

    const periodMatch = text.match(this.patterns.relativePeriod);
    if (periodMatch) {
      return {
        type: 'relative',
        unit: periodMatch[2].toLowerCase(),
        modifier: periodMatch[1].toLowerCase()
      };
    }
  }

  calculateDate(expr: TimeExpression): Date {
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
  }
}

- Add proper class-based structure following Airbnb style guide
- Group related configuration options into config objects
- Use Set for activeFilters to prevent duplicates
- Add support for combined filter conditions
- Improve HTML structure with wrapper classes
- Add proper event handling

- Follow modern javascript best practices, never use react
- Implement proper error handling
- Follow the repository pattern for data access
- Implement service layer for business logic
- Use dependency injection where appropriate
- Follow event-driven architecture for updates
- Implement proper logging and monitoring, using WINSTON

- Modify the main.js file to ensure the app quits when all windows are closed, regardless of the platform.

## Performance Requirements

- Application startup < 3 seconds
- Search response time < 500ms
- Smooth scrolling at 60fps
- Memory usage < 500MB
- Efficient data caching
- Batch operations for bulk changes

## Error Handling

- Implement comprehensive error catching
- User-friendly error messages
- Error logging system
- Automatic error recovery where possible
- Crash reporting System
