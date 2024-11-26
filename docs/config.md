# Configuration System Documentation

## Overview

The PIM application uses a multi-tiered configuration system with clear priority levels:

1. Environment Variables (Highest)
2. Database Settings
3. User Config File
4. Default Values (Lowest)

## Configuration Values

### Parser Configuration code

```javascript
parser: {
  maxDepth: 3,              // Maximum depth for recursive operations
  ignoreFiles: [            // Files/folders to ignore
    '.git', 
    'node_modules'
  ],
  outputFormat: 'json',     // Output format (json or text)
  tellTruth: true          // Enable/disable certain validations
}
```

### Reminder Configuration

```javascript
reminders: {
  defaultMinutes: 15,      // Default reminder time in minutes
  allowMultiple: true      // Allow multiple reminders per item
}
```

## File Locations

### Config File

The `config.json` file is stored in the application's user data directory:

```bash
# macOS
~/Library/Application Support/pim/config.json

# Windows
%APPDATA%\pim\config.json

# Linux
~/.config/pim/config.json
```

### Database

Settings are also stored in the SQLite database:

```bash
# macOS
~/Library/Application Support/pim/pim.db

# Windows
%APPDATA%\pim\pim.db

# Linux
~/.config/pim/pim.db
```

## Environment Variables

Override any setting using environment variables:

```bash
# Parser Settings
pim.parser.maxDepth=5
pim.parser.tellTruth=false
pim.parser.ignoreFiles='[".git","node_modules","dist"]'

# Reminder Settings
pim.reminders.defaultMinutes=30
pim.reminders.allowMultiple=true
```

## Testing Configuration

### Unit Tests

```javascript
describe('Config Tests', () => {
  let configManager;
  let mockDb;

  beforeEach(async () => {
    mockDb = new MockDatabase();
    configManager = new ConfigManager(mockDb);
    await configManager.initialize();
  });

  test('default values', () => {
    const config = configManager.get('parser');
    expect(config.maxDepth).toBe(3);
  });

  test('environment override', async () => {
    process.env['pim.parser.maxDepth'] = '5';
    await configManager.initialize();
    expect(configManager.get('parser').maxDepth).toBe(5);
  });
});
```

### Manual Testing

1. **Test Default Values**

   ```bash
   npm start
   ```

2. **Test Environment Variables**

   ```bash
   pim.parser.maxDepth=5 npm start
   ```

3. **Test Config File**

   ```bash
   # Create config.json in user data directory
   {
     "parser": {
       "maxDepth": 5
     }
   }
   ```

4. **Test Database Settings**

   ```javascript
   await configManager.updateSettings('parser', {
     maxDepth: 5
   });
   ```

## Validation Rules

### Parser Settings

- **maxDepth**
  - Type: Number
  - Must be positive
  - Used for: Recursive operations depth limit

- **ignoreFiles**
  - Type: Array of strings
  - Used for: Files/folders to skip during processing

- **outputFormat**
  - Type: String
  - Valid values: 'json', 'text'
  - Used for: Output formatting

- **tellTruth**
  - Type: Boolean
  - Used for: Validation control

### Reminder Settings

- **defaultMinutes**
  - Type: Number
  - Must be positive
  - Used for: Default reminder time

- **allowMultiple**
  - Type: Boolean
  - Used for: Multiple reminder control

## Debugging

### Debug Mode

```bash
DEBUG=true npm start
```

### Debug Points

```javascript
// Check current config
console.log(configManager.currentConfig);

// Monitor changes
configManager.logger.debug = true;

// Check file loading
const configPath = path.join(app.getPath('userData'), 'config.json');
console.log('Looking for config at:', configPath);
```

### Common Issues

1. **Settings Not Persisting**
   - Check database initialization
   - Verify file permissions
   - Check config file syntax

2. **Invalid Values**
   - Check validation rules
   - Verify environment variable format
   - Check JSON syntax in config file

3. **Priority Conflicts**
   - Remember: Environment variables override everything
   - Database overrides config file
   - Config file overrides defaults

## Best Practices

1. **Development**
   - Use environment variables for temporary changes
   - Use config file for persistent changes
   - Use database for user-specific settings

2. **Testing**
   - Reset environment before each test
   - Use mock database
   - Test each configuration tier separately

3. **Production**
   - Use config file for system-wide settings
   - Use database for user preferences
   - Use environment variables for emergency overrides

## Configuration Variables Reference

### Parser Configuration text

#### maxDepth

- **Type**: Number
- **Default**: 3
- **Valid Values**: Positive integers
- **Purpose**: Controls how deep the parser will traverse in recursive operations
- **Example Use Cases**:
  - Directory scanning
  - Nested structure parsing
  - Recursive data processing
- **Environment Override**: `pim.parser.maxDepth=5`

#### ignoreFiles

- **Type**: Array of strings
- **Default**: ['.git', 'node_modules']
- **Valid Values**: Array of file/directory names
- **Purpose**: Specifies which files or directories to skip during processing
- **Example Use Cases**:
  - Skip version control directories
  - Ignore build artifacts
  - Skip dependency directories
- **Environment Override**: `pim.parser.ignoreFiles='[".git","node_modules","dist"]'`

#### outputFormat

- **Type**: String
- **Default**: 'json'
- **Valid Values**: ['json', 'text']
- **Purpose**: Determines the format of parser output
- **Example Use Cases**:
  - API responses
  - File exports
  - Data interchange
- **Environment Override**: `pim.parser.outputFormat=json`

#### tellTruth

- **Type**: Boolean
- **Default**: true
- **Valid Values**: true/false
- **Purpose**: Controls validation strictness and error reporting
- **Example Use Cases**:
  - Development debugging
  - Testing environments
  - Production safety checks
- **Environment Override**: `pim.parser.tellTruth=false`

### Reminder Configuration text

#### defaultMinutes

- **Type**: Number
- **Default**: 15
- **Valid Values**: Positive integers
- **Purpose**: Sets the default reminder time in minutes
- **Example Use Cases**:
  - Meeting reminders
  - Task notifications
  - Event alerts
- **Environment Override**: `pim.reminders.defaultMinutes=30`

#### allowMultiple

- **Type**: Boolean
- **Default**: true
- **Valid Values**: true/false
- **Purpose**: Controls whether multiple reminders are allowed per item
- **Example Use Cases**:
  - Multiple meeting reminders
  - Staged notifications
  - Escalating alerts
- **Environment Override**: `pim.reminders.allowMultiple=false`

### Configuration Interactions

#### Variable Dependencies

Some configuration variables interact with each other:

```javascript
{
  "parser": {
    "maxDepth": 3,
    "tellTruth": true    // Affects validation of maxDepth
  }
}
```

#### Validation Rules text

Each variable has specific validation rules:

1. **Numbers**
   - Must be positive
   - Must be integers for certain values
   - May have maximum limits

2. **Arrays**
   - Must be valid JSON arrays
   - Elements must be strings for ignoreFiles
   - Duplicates are removed

3. **Strings**
   - Must be one of predefined values for outputFormat
   - Case sensitive unless specified

4. **Booleans**
   - Must be true/false
   - String values "true"/"false" are converted

### Testing Configurations

#### Unit Testing Variables

```javascript
test('should validate maxDepth', () => {
  expect(() => configManager.updateSettings('parser', {
    maxDepth: -1
  })).toThrow();
  
  expect(() => configManager.updateSettings('parser', {
    maxDepth: 5
  })).not.toThrow();
});
```

#### Integration Testing

```javascript
test('should respect variable interactions', async () => {
  await configManager.updateSettings('parser', {
    maxDepth: 5,
    tellTruth: false
  });
  
  const config = configManager.get('parser');
  expect(config.maxDepth).toBe(5);
  expect(config.tellTruth).toBe(false);
});
```

### Common Configuration Patterns

#### Development Setup

```json
{
  "parser": {
    "maxDepth": 10,
    "tellTruth": true,
    "outputFormat": "json"
  },
  "reminders": {
    "defaultMinutes": 5,
    "allowMultiple": true
  }
}
```

#### Production Setup

```json
{
  "parser": {
    "maxDepth": 3,
    "tellTruth": true,
    "outputFormat": "json"
  },
  "reminders": {
    "defaultMinutes": 15,
    "allowMultiple": true
  }
}
```

#### Testing Setup

```json
{
  "parser": {
    "maxDepth": 1,
    "tellTruth": false,
    "outputFormat": "json"
  },
  "reminders": {
    "defaultMinutes": 1,
    "allowMultiple": false
  }
}
```
