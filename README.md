# Personal Information Manager (PIM)

A modern desktop application for managing personal information, tasks, and notes with advanced natural language processing capabilities.

## Features

### Core Features

- Natural language input processing
- Priority system (high, medium, low)
- Category tagging
- Smart date/time parsing
- Advanced filtering capabilities

### Advanced Parsing Features

- Complex date handling (relative dates, weekends, last/first of month)
- Time of day understanding (morning 9-12, afternoon 12-5, evening 5-9)
- Team and attendee management
- Project and context tracking
- Location detection (office, online, travel)
- Reminder and follow-up system
- Status and progress tracking
- Dependencies and blockers
- Subject and hashtag support

## Installation

1. Clone the repository:

```bash
git clone https://github.com/ddttom/pim.git
cd pim
```

2. Install dependencies:

```bash
npm install
```

3. Start the application:

```bash
npm start
```

## Usage

### Natural Language Examples

#### Basic Tasks

- "Call John tomorrow at 2pm"
- "Email Sarah about the report by Friday"
- "Review code pull request #123"
- "Text Mike about lunch meeting"

#### Date and Time

- "Meeting next Wednesday at 10am"
- "Call on the last Friday of the month"
- "Team sync every Monday morning"
- "Project review next weekend"

#### Complex Tasks

```bash
urgent zoom meeting with John and team Engineering 
about Q4 Planning #strategy tomorrow at 10am 
for 2 hours, remind me 30 minutes before
```

### Parser Output Examples

```javascript
// Input: "Call John tomorrow at 2pm"
{
  action: "call",
  contact: "John",
  datetime: "2024-01-25T14:00:00",
  timeOfDay: {
    hour: 14,
    minutes: 0
  }
}
```

## Development

### Configuration System

The application uses a multi-tiered configuration system with clear priority levels. For detailed configuration documentation, see [Configuration Documentation](docs/config.md).

#### Quick Start

1. **Default Values** (Lowest Priority)
   ```javascript
   // Built into ConfigManager
   const defaults = {
     parser: {
       maxDepth: 3,
       ignoreFiles: ['.git', 'node_modules']
     }
   };
   ```

2. **Environment Variables** (Highest Priority)
   ```bash
   # Override any setting
   pim.parser.maxDepth=5
   ```

3. **Config File Location**
   ```bash
   # macOS
   ~/Library/Application Support/pim/config.json
   ```

### Project Structure
```
pim/
├── src/
│   ├── config/
│   │   ├── ConfigManager.js    # Configuration management
│   │   └── parser.config.js    # Default parser config
│   ├── plugins/
│   │   ├── pluginManager.js    # Plugin system
│   │   └── locationPlugin.js   # Example plugin
│   ├── services/
│   │   ├── database.js         # Database operations
│   │   └── parser.js          # Natural language parsing
│   └── main.js                # Main application entry
├── docs/
│   └── config.md              # Detailed configuration documentation
├── tests/
│   ├── __mocks__/             # Test mocks
│   └── parser.test.js         # Parser tests
└── db/
    └── config.json            # User configuration
```

### Environment Variable Overrides

The application supports environment variable overrides for any configuration setting using the prefix `pim.`. This provides a way to override settings without modifying files or database.

#### Priority Order (Highest to Lowest)

1. Environment Variables (`pim.category.setting`)
2. Database Settings
3. Config File Settings
4. Default Values

#### Usage of env variables

Set environment variables following this pattern:

```bash
pim.{category}.{setting}={value}
```

Examples:

```bash
# Override parser settings
export pim.parser.maxDepth=5
export pim.parser.tellTruth=false
export pim.parser.ignoreFiles='[".git","node_modules","dist"]'

# Override reminder settings
export pim.reminders.defaultMinutes=30
export pim.reminders.allowMultiple=true
```

#### Type Conversion

Environment variables are automatically converted to the correct type:

- Boolean values: "true"/"false" strings
- Numbers: Converted from string to number
- Arrays: Must be valid JSON strings
- Strings: Used as-is

#### Validation

Environment variable values are validated against the same schema as other settings:

```javascript
// Example validation
pim.parser.maxDepth=5    // ✓ Valid (positive number)
pim.parser.maxDepth=-1   // ✗ Invalid (must be positive)
pim.parser.tellTruth=no  // ✗ Invalid (must be true/false)
```

#### Use Cases

1. **Testing Different Configurations**

   ```bash
   pim.parser.maxDepth=10 npm test
   ```

2. **Debugging**

   ```bash
   pim.parser.tellTruth=false npm start
   ```

3. **CI/CD Environments**

   ```bash
   pim.parser.outputFormat=json npm run build
   ```

4. **Emergency Overrides**
   When you need to change settings without modifying files or database

### Plugin System

#### Plugin Structure

A plugin must implement this interface:

```typescript
interface Plugin {
  // Required patterns for text matching
  patterns: {
    [key: string]: RegExp;
  };
  
  // Parser function that processes text
  parser: (text: string) => object | null;
}
```

#### Creating a Plugin

```javascript
const myPlugin = {
  patterns: {
    myPattern: /your-pattern-here/i,
    anotherPattern: /another-pattern/i
  },

  parser: (text) => {
    const results = {};
    
    for (const [type, pattern] of Object.entries(myPlugin.patterns)) {
      const match = text.match(pattern);
      if (match?.groups) {
        results[type] = match.groups[type];
      }
    }
    
    return Object.keys(results).length > 0 ? results : null;
  }
};
```

#### Plugin Manager API

```javascript
// Get plugin manager instance
const pluginManager = require('./plugins/pluginManager');

// Register a plugin
pluginManager.register('myPlugin', myPlugin);

// Get all patterns
const patterns = pluginManager.getAllPatterns();

// Parse text with all plugins
const results = pluginManager.parseAll('text to parse');
```

#### Plugin Best Practices

1. **Pattern Naming**
   - Use descriptive names
   - Group related patterns
   - Use named capture groups

2. **Error Handling**
   - Return null for no matches
   - Handle partial matches
   - Log errors appropriately

3. **Performance**
   - Optimize regex patterns
   - Cache compiled patterns
   - Avoid expensive operations

4. **Testing**

   ```javascript
   describe('My Plugin', () => {
     test('should match pattern', () => {
       const result = myPlugin.parser('test text');
       expect(result).toMatchObject({
         expectedKey: 'expectedValue'
       });
     });
   });
   ```

### Database Integration

The application uses SQLite for persistent storage:

```javascript
// Database location
Mac: ~/Library/Application Support/pim/pim.db
Windows: %APPDATA%\pim\pim.db
Linux: ~/.config/pim/pim.db
```

#### Database Operations

```javascript
// Add entry
const entry = await db.addEntry({
  raw_content: "Meeting tomorrow",
  created_at: new Date().toISOString()
});

// Get entries
const entries = await db.getEntries();

// Delete entry
await db.deleteEntry(entryId);
```

### Testing & Debugging

Run all tests:

```bash
npm test
```

Run parser tests:

```bash
npm run test:parser
```

Run specific test file:

```bash
npx jest tests/parser.test.js
```

### Logging

Configure logging levels:

```javascript
process.env.LOG_LEVEL = 'debug'; // debug, info, warn, error
```

### Error Handling

The parser provides detailed error information:

```javascript
try {
  const result = parser.parse(text);
} catch (error) {
  console.error('Parsing failed:', error.message);
}
```

## API Reference

### Parser API

#### Core Methods

```javascript
// Create parser instance
const parser = new Parser(logger);

// Parse text input
const result = parser.parse("meeting tomorrow at 2pm");

// Calculate relative date
const date = parser.calculateRelativeDate("next Wednesday");
```

#### Parser Output Structure

```typescript
interface ParserOutput {
  // Core attributes
  action: string;              // Primary action (call, text, meet, etc.)
  datetime?: Date;            // Scheduled date and time
  dueDate?: Date;            // Deadline
  final_deadline?: Date;      // Latest of datetime and dueDate
  rawContent: string;         // Original input text

  // Time-related
  timeOfDay?: {
    hour?: number;           // 24h format
    minutes?: number;
    period?: string;         // morning, afternoon, evening
    start?: number;          // Period start hour
    end?: number;           // Period end hour
  };
  
  duration?: {
    hours?: number;
    minutes?: number;
  };

  // People and teams
  contact?: string;          // Primary contact
  attendees?: {
    people: string[];       // Array of attendee names
    teams: string[];       // Array of team names
  };

  // Location
  location?: {
    type: 'office' | 'online' | 'travel';
    value: string;
    link?: string;         // For online meetings
  };

  // Project management
  project?: {
    project?: string;      // Project name
    contexts?: string[];   // Technical contexts ($tags)
  };

  // Status and progress
  status?: {
    progress?: number;     // Percentage
    state?: string;       // Current state
  };
  
  complexity?: {
    level: 'high' | 'medium' | 'low';
  };

  priority?: 'high' | 'medium' | 'low';
}
```

### Configuration API

#### ConfigManager Methods

```typescript
interface ConfigManager {
  // Initialize configuration
  initialize(): Promise<Config>;
  
  // Get configuration values
  get(category: string, key?: string): any;
  
  // Update settings
  updateSettings(category: string, settings: object): Promise<Config>;
  
  // Load config from file
  loadConfigFile(): Promise<object>;
  
  // Validate configuration
  validateConfig(config: Config): void;
}
```

#### Configuration Schema

```typescript
interface Config {
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

### Plugin API

#### Plugin Interface

```typescript
interface Plugin {
  // Required regex patterns
  patterns: {
    [key: string]: RegExp;
  };
  
  // Parser function
  parser: (text: string) => object | null;
}
```

#### Plugin Manager Methods

```typescript
interface PluginManager {
  // Register new plugin
  register(name: string, plugin: Plugin): void;
  
  // Get all patterns
  getAllPatterns(): { [key: string]: RegExp };
  
  // Parse text with all plugins
  parseAll(text: string): { [pluginName: string]: object };
  
  // Event listeners
  on(event: 'beforeParse' | 'afterParse', callback: Function): void;
}
```

#### Plugin Events

```typescript
interface PluginEvents {
  beforeParse: (text: string) => void;
  afterParse: (results: object) => void;
}
```

## Contributing & License

1. Fork the repository
2. Create your feature branch
3. Write tests for new features
4. Submit a pull request

ISC License (ISC)

Copyright (c) 2024 Tom Cranstoun

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

### Environment Variables

The application supports these environment variables:

```bash
LOG_LEVEL=debug      # Logging level (debug, info, warn, error)
NODE_ENV=development # Environment (development, production)
CONFIG_PATH         # Optional: Override default config.json location
```

### Backup and Restore

#### Settings Backup

```javascript
// Export current settings
await configManager.exportSettings(backupPath);

// Restore from backup
await configManager.restoreSettings(backupPath);
```

#### Database Backup

The database file (pim.db) can be backed up from the application data directory:

- Mac: `~/Library/Application Support/pim/pim.db`
- Windows: `%APPDATA%\pim\pim.db`
- Linux: `~/.config/pim/pim.db`

### Debugging

#### Debug Mode

Start the app in debug mode:

```bash
DEBUG=true npm start
```

#### Common Debug Points

- Configuration loading: `debug('config:load')`
- Plugin registration: `debug('plugin:register')`
- Database operations: `debug('db:operation')`

### Common Issues & Solutions

#### Configuration Issues

1. **Settings Not Persisting**

   ```javascript
   // Check if database is initialized
   if (!db.initialized) {
     await db.initialize();
   }
   ```

2. **Invalid Config Values**

   ```javascript
   // Validate before saving
   try {
     await configManager.updateSettings('parser', {
       maxDepth: 5  // Must be positive number
     });
   } catch (error) {
     console.error('Validation failed:', error);
   }
   ```

#### Database Issues

1. **Database Location**

   ```javascript
   const dbPath = path.join(app.getPath('userData'), 'pim.db');
   console.log('Database location:', dbPath);
   ```

2. **Database Initialization**

   ```javascript
   // Proper initialization order
   const db = new DatabaseService(dbPath);
   await db.initialize();
   const configManager = new ConfigManager(db);
   await configManager.initialize();
   ```

### Testing

#### Mock Database for Tests

```javascript
// __mocks__/database.js
class MockDatabase {
  async initialize() {
    this.initialized = true;
  }
  
  async getAllSettings() {
    return {};
  }
  
  async saveSetting(category, settings) {
    return true;
  }
}
```

#### Config Manager Tests

```javascript
describe('Config Manager', () => {
  let configManager;
  let mockDb;

  beforeEach(async () => {
    mockDb = new MockDatabase();
    configManager = new ConfigManager(mockDb);
    await configManager.initialize();
  });

  test('should use default values', () => {
    const config = configManager.get('parser');
    expect(config.maxDepth).toBe(3);
  });
});
```

### Development Workflow

1. **Setup Development Environment**

   ```bash
   # Install dependencies
   npm install

   # Start in development mode
   npm run dev
   ```

2. **Configuration Changes**
   - Edit default values in ConfigManager
   - Update validation schema
   - Test with different configurations

3. **Database Operations**
   - Use DatabaseService for persistence
   - Handle migrations when schema changes
   - Backup data before major changes

4. **Plugin Development**
   - Create plugin in src/plugins
   - Register with PluginManager
   - Add tests for new functionality

### Architecture Overview

```bash
pim/
├── src/
│   ├── config/
│   │   ├── ConfigManager.js    # Configuration management
│   │   └── parser.config.js    # Default parser config
│   ├── plugins/
│   │   ├── pluginManager.js    # Plugin system
│   │   └── locationPlugin.js   # Example plugin
│   ├── services/
│   │   ├── database.js         # Database operations
│   │   └── parser.js          # Natural language parsing
│   └── main.js                # Main application entry
├── docs/
│   └── config.md              # Detailed configuration documentation
├── tests/
│   ├── __mocks__/             # Test mocks
│   └── parser.test.js         # Parser tests
└── db/
    └── config.json            # User configuration
```

### Performance Considerations

1. **Configuration Loading**
   - Lazy loading of plugins
   - Cache frequently used settings
   - Validate only on changes

2. **Database Operations**
   - Use transactions for multiple operations
   - Index frequently queried fields
   - Batch updates when possible

3. **Plugin System**
   - Compile regex patterns once
   - Cache plugin results where appropriate
   - Load plugins on demand

## Contributing

### Git Workflow

1. **Fork and Clone**

   ```bash
   git clone https://github.com/ddttom/pim.git
   cd pim
   ```

2. **Branch Naming**

   ```bash
   # Feature branches
   git checkout -b feature/description
   
   # Bug fixes
   git checkout -b fix/issue-description
   
   # Documentation
   git checkout -b docs/description
   ```

3. **Commit Messages**

   ```bash
   # Format
   <type>(<scope>): <description>
   
   # Examples
   feat(parser): add support for recurring events
   fix(config): resolve config file loading issue
   docs(api): update plugin documentation
   ```

4. **Pull Request Process**
   - Create PR against `main` branch
   - Include tests for new features
   - Update documentation as needed
   - Ensure CI passes

### Development Setup

1. **Prerequisites**
   - Node.js 18+
   - npm 8+
   - Git

2. **Repository Setup**

   ```bash
   # Clone repository
   git clone https://github.com/ddttom/pim.git
   
   # Install dependencies
   cd pim
   npm install
   
   # Create git hooks
   npm run prepare
   ```

## License

ISC License (ISC)

Copyright (c) 2024 Tom Cranstoun

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

### Third-Party Licenses

This project uses the following open-source packages:

- **Electron**: MIT License
- **SQLite**: Public Domain
- **Jest**: MIT License
- [Full list in package.json]

## Repository

- **Source**: [https://github.com/ddttom/pim](https://github.com/ddttom/pim)
- **Issues**: [https://github.com/ddttom/pim/issues](https://github.com/ddttom/pim/issues)
- **Wiki**: [https://github.com/ddttom/pim/wiki](https://github.com/ddttom/pim/wiki)

### Release Process

1. **Version Bump**

   ```bash
   npm version [major|minor|patch]
   ```

2. **Build & Test**

   ```bash
   npm run build
   npm test
   ```

3. **Create Release**

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

### Support

For support, please:

1. Check the [documentation](https://github.com/ddttom/pim/wiki)
2. Search [existing issues](https://github.com/ddttom/pim/issues)
3. Create a new issue if needed
