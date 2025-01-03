# Configuration System

## Overview

The application uses a multi-layered configuration system with clear priority levels (highest to lowest):

1. Environment Variables
2. Settings File (settings.json)
3. User Config File (config.json)
4. Default Values

## File Locations

### Project Structure

```bash
config/                 # Configuration templates
├── ...                # Configuration presets

data/                  # Application data
├── pim.db            # Main database
└── settings.json     # User settings

db/                    # Database configuration
└── config.json       # Database settings

src/config/           # Configuration management
├── ConfigManager.js  # Core configuration logic
└── parser.config.js  # Parser-specific config
```

### Database File

- **Location**: `data/pim.db`
- **Purpose**: Database file for entries only
- **Managed by**: JsonDatabaseService
- **Contains**:

  ```json
  {
    "entries": [],      // User entries/tasks
    "meta": {
      "version": "1.0.0",
      "last_backup": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

### Settings File

- **Location**: `data/settings.json`
- **Purpose**: Runtime settings and user preferences
- **Managed by**: SettingsService
- **Example**:

  ```json
  {
    "parser": {
      "maxDepth": 5,
      "ignoreFiles": [".git", "node_modules", "dist"],
      "outputFormat": "json",
      "tellTruth": true
    },
    "reminders": {
      "defaultMinutes": 30,
      "allowMultiple": true
    }
  }
  ```

### Database Config

- **Location**: `db/config.json`
- **Purpose**: Static configuration overrides
- **Managed by**: ConfigManager
- **Used for**: Initial/default configuration values

## Testing

### Test Environment Setup

The test environment is configured to:

- Use jsdom for DOM manipulation tests
- Create isolated test directories
- Clean up test data automatically
- Reset mocks between tests
- Handle file system operations safely

### Test Files

The application includes comprehensive test suites:

1. **Configuration Tests** (`tests/config.test.js`)
   - Tests settings management
   - Environment variable overrides
   - Configuration validation

   ```bash
   npm run test:config
   ```

2. **Database Tests** (`tests/database.test.js`)
   - CRUD operations
   - Entry filtering
   - Batch operations

   ```bash
   npm run test:db
   ```

3. **Parser Persistence Tests** (`tests/parser-persist.test.js`)
   - Integration between parser and database
   - Complex message parsing and storage
   - Example test message:

     ```bash
     "Call Fiona next wednesday re Project Cheesecake urgently with @robin and @ian #disaster"
     ```

   - Tests parsing of:
     - Actions (call)
     - People (Fiona)
     - Dates (next wednesday)
     - Topics (Project Cheesecake)
     - Priority (urgently → high)
     - Participants (@robin, @ian)
     - Tags (#disaster)

   ```bash
   npm run test:parser-persist
   ```

### Test Data Management

- Tests use isolated data directory: `tests/__test_data__/`
- Each test run uses unique filenames with timestamps
- Example: `pim.test.1234567890.json`
- Automatic directory creation and cleanup
- Proper handling of test media files
- Safe concurrent test execution

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:config      # Configuration tests
npm run test:db         # Database operations
npm run test:parser     # Parser functionality
npm run test:renderer   # UI components
npm run test:rich-text  # Editor features
npm run test:plugins    # Plugin system
```

### Mock Implementation

The test suite includes carefully crafted mocks for:

- Editor functionality
- File system operations
- IPC communication
- DOM manipulation
- Plugin system
- Configuration management

Example mock for editor:

```javascript
jest.mock('../src/renderer/editor/editor.js', () => {
  const mockEditor = {
    root: { innerHTML: '' },
    getSelection: jest.fn(() => ({ index: 0 })),
    insertEmbed: jest.fn()
  };
  
  return {
    initializeEditor: jest.fn(() => mockEditor),
    getEditor: jest.fn(() => mockEditor),
    handleImageUpload: jest.fn(),
    showEditor: jest.fn(),
    clearEditor: jest.fn(),
    getEditorContent: jest.fn()
  };
});
```

## Service Responsibilities

### JsonDatabaseService

- Manages entries only
- No settings storage
- Handles CRUD operations
- Supports filtering and sorting
- Provides transaction-like batch operations

### SettingsService

- Manages runtime settings
- Persists user preferences
- Handles settings file I/O
- Provides atomic setting updates

### ConfigManager

- Coordinates configuration loading
- Validates settings
- Applies environment variables
- Manages defaults
- Emits configuration events

## Developer Guidelines

### Adding New Settings

1. Add default value in ConfigManager
2. Add validation schema
3. Update relevant tests
4. Document in this file

### Environment Variables

- Prefix: `pim.`
- Format: `pim.category.setting=value`
- Examples:

  ```bash
  pim.parser.maxDepth=5
  pim.reminders.defaultMinutes=30
  ```

### Error Handling

- Settings validation errors include:
  - Category
  - Invalid value
  - Validation rule
- Database errors maintain atomicity
- Failed batch operations roll back

### Testing New Features

1. Create isolated test file
2. Use unique test filenames
3. Clean up test data
4. Test both success and failure cases
5. Include integration tests if needed

### Best Practices

1. **Configuration**
   - Use environment variables for temporary changes
   - Use settings.json for user preferences
   - Use config.json for application defaults

2. **Database**
   - Use batch operations for multiple updates
   - Always validate parsed data
   - Include proper error handling

3. **Testing**
   - Keep tests isolated
   - Use unique test files
   - Clean up test data
   - Test edge cases
   - Include integration tests

4. **Development**
   - Follow existing patterns
   - Document changes
   - Update tests
   - Use proper error handling
   - Maintain separation of concerns

This configuration system provides:

- Clear separation of concerns
- Flexible defaults
- User customization
- Runtime configuration
- Environment-specific overrides
- Data persistence
- Validation guarantees
