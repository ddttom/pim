# Configuration System Documentation

## Overview

The PIM application uses a multi-tiered configuration system with clear priority levels:

1. Environment Variables (Highest)
2. Database Settings
3. User Config File
4. Default Values (Lowest)

## Settings Management System

The application includes a modal-based settings UI that provides configuration for:

### Time Periods

- Morning hours configuration
- Afternoon hours configuration
- Evening hours configuration

### Action Defaults

- Default times for different actions (call, meet, review, etc.)
- Default reminder intervals
- Default status settings

### UI Settings

- Form layout preferences
- Display options
- Notification settings

## Configuration Values

### Parser Configuration

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

## Settings Synchronization

The application maintains synchronization between:

1. Parser Configuration
   - Natural language processing patterns
   - Default values for parsing
   - Pattern matching rules

2. UI Settings
   - Form layout and structure
   - Modal display options
   - User interface preferences

3. Stored Preferences
   - Database-stored settings
   - Configuration file values
   - Environment variable overrides

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

4. **Settings Modal Issues**
   - Check for duplicate form content
   - Verify data flow between main and renderer processes
   - Validate form structure and nesting

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

4. **Settings Management**
   - Keep UI and parser configurations in sync
   - Validate all settings values
   - Implement proper save/load functionality
   - Add error handling and user feedback
   - Maintain form layout and responsiveness

## Known Issues and Solutions

### Settings Form Issues

1. **Duplicate Form Content**
   - Problem: Form content appearing multiple times in settings modal
   - Solution: Ensure single instance of form components
   - Prevention: Implement proper component lifecycle management

2. **Settings Retrieval**
   - Problem: Settings not properly retrieved from main process
   - Solution: Implement proper IPC communication
   - Prevention: Add error handling and validation

3. **Form Structure**
   - Problem: Nested form issues causing layout problems
   - Solution: Flatten form structure where possible
   - Prevention: Follow form design best practices

### Configuration Management Issues

1. **Synchronization**
   - Problem: Configuration not properly syncing between components
   - Solution: Implement proper state management
   - Prevention: Use centralized configuration store

2. **Validation**
   - Problem: Invalid settings values being saved
   - Solution: Add comprehensive validation
   - Prevention: Implement type checking and validation rules

3. **Data Flow**
   - Problem: Inconsistent data flow between processes
   - Solution: Standardize IPC communication
   - Prevention: Follow established communication patterns
