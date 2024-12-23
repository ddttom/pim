# Project State

PIM (Personal Information Manager) is designed to be a lightweight, fast, and efficient note-taking application. The focus is on simplicity and performance, using vanilla JavaScript without TypeScript or heavy frameworks. This approach ensures quick startup times and minimal resource usage.

## Recent Updates

### State Management Implementation

- Added centralized state management service
  - Action-based state mutations
  - Immutable state updates
  - Selector pattern for state access
  - Comprehensive error handling
  - State validation
  - IPC state synchronization
- Implemented constants management
  - Centralized configuration values
  - Documented constant usage
  - Organized by functionality
  - Enhanced maintainability

### Parser Service Improvements

- Refactored the parser service and individual parsers, enhancing maintainability and organization
- Introduced standardized parser imports and improved performance tracking with parser statistics
- Enhanced individual parsers with refined patterns, error handling, and robust input validation
- Updated logging mechanisms across all parsers to ensure reliability and easier debugging

## Current Status

### Completed Features

1. State Management:
   - ✅ Centralized store implementation
     - Action creators for state mutations
     - Pure selectors for state access
     - Immutable state updates
     - State validation system
   - ✅ IPC Communication
     - Secure channel validation
     - Error handling
     - State synchronization
     - Message validation
   - ✅ Constants Management
     - Action type definitions
     - IPC channel names
     - UI constants
     - Error messages
   - ✅ Error Handling
     - Standardized error messages
     - Error state management
     - Error recovery
     - Logging integration

2. Parser System:
   - ✅ Standardized parser architecture
     - Common base structure
     - Consistent error handling
     - Standardized confidence scoring
     - Rich metadata generation
   - ✅ Nine core parsers implemented
     - Date Parser (ISO, natural, relative)
     - Time Parser (12/24h, periods)
     - Project Parser (explicit, references)
     - Status Parser (explicit, progress)
     - Tags Parser (hashtags, categories)
     - Subject Parser (cleanup, key terms)
     - Recurring Parser (intervals, patterns)
     - Reminders Parser (time-based, relative)
     - Priority Parser (explicit, contextual)
   - ✅ Additional parsers implemented and tested
     - Action Parser (verbs, completion)
     - Attendees Parser (lists, roles)
     - Categories Parser (hierarchical, multiple)
     - Complexity Parser (levels, scoring)
     - Contact Parser (email, phone, references)
     - Contexts Parser (location, tool, time)
     - Dependencies Parser (tasks, relationships)
     - Duration Parser (explicit, natural)
     - Links Parser (URLs, files, markdown)
     - Location Parser (rooms, addresses)
     - Participants Parser (lists, roles)
     - TimeOfDay Parser (12/24h, natural)
     - Urgency Parser (levels, keywords)
   - ✅ Comprehensive test coverage
     - Input validation tests
     - Pattern matching tests
     - Edge case coverage
     - Error handling tests
     - Complete parser test suite
     - Standardized test structure
     - Confidence scoring validation
     - Metadata verification
   - ✅ Pattern matching system
     - Regular expression optimization
     - Priority-based matching
     - Context awareness
   - ✅ Confidence scoring
     - Base confidence (0.7)
     - Pattern-based modifiers
     - Position-based adjustments
     - Context-based boosting
   - ✅ Error handling
     - Standardized error codes
     - Detailed error messages
     - Error aggregation
     - Logging integration
   - ✅ Metadata enrichment
     - Pattern information
     - Confidence scores
     - Original matches
     - Context data
   - ✅ Integration system
     - Central parser registry
     - Batch processing
     - Result aggregation
     - Error handling

3. Core Infrastructure:
   - ✅ Configuration system
     - Two-tier configuration
     - Migration support
     - Validation
   - ✅ Settings management
     - User preferences
     - Export/Import
     - Defaults handling
   - ✅ Logger implementation
     - Level-based logging
     - File rotation
     - Error tracking
   - ✅ Error handling
     - Error codes
     - Stack traces
     - User messages
   - ✅ Test framework
     - Jest configuration
     - Mock system
     - Coverage reporting

4. UI Components:
   - ✅ Rich text editor
   - ✅ Entry management
   - ✅ Modal system
   - ✅ Settings interface
   - ✅ Theme support

### In Progress

1. Parser Enhancements:
   - ✅ Performance optimization
     - Pattern compilation
     - Caching system
     - Batch processing
   - ✅ Pattern refinement
     - Complex patterns
     - Edge cases
     - Conflict resolution
   - 🔄 Additional metadata
     - Context information
     - Relationship data
     - Historical data
   - 🔄 Context awareness
     - Previous results
     - Related patterns
     - User preferences

2. Integration Features:
   - 🔄 Real-time parsing
   - 🔄 Batch processing
   - 🔄 Parser chaining
   - 🔄 Result caching

## Development Standards

### Logging Standards

1. Logger Initialization

```javascript
// Always initialize at module level with parser name
import { createLogger } from '../../../utils/logger.js';
const logger = createLogger('ParserName');
```

2. Error Logging

```javascript
// Always include error object and context
logger.error('Error in parser:', {
    error: error.message,
    stack: error.stack,
    input: text
});

// For specific operation errors
logger.error('Operation failed:', {
    operation: 'extractValue',
    error: error.message,
    context: matches
});
```

3. Debug Logging

```javascript
// Pattern matches
logger.debug('Pattern match found:', {
    pattern: patternName,
    match: match[0],
    value,
    confidence
});

// State changes
logger.debug('State updated:', {
    previous: prevValue,
    current: newValue,
    changes: diff
});
```

4. Warning Logging

```javascript
// Input validation
logger.warn('Invalid input:', { 
    text,
    type: typeof text,
    length: text?.length 
});

// Operation failures
logger.warn('Operation failed:', {
    operation: 'extractValue',
    matches,
    type,
    error
});
```

5. Logging Context

- Always include relevant data for debugging
- Structure objects for readability
- Include operation names
- Add input values where relevant
- Include state changes

6. Logging Levels

- ERROR: Unrecoverable errors, invalid states
- WARN: Recoverable issues, validation failures
- INFO: Important state changes, operations
- DEBUG: Pattern matches, detailed operations

7. Best Practices

- Use structured logging (objects over strings)
- Include operation context
- Log state transitions
- Track pattern matches
- Include confidence scores
- Log validation failures
- Track performance metrics

8. Performance Considerations

- Use debug level for detailed logging
- Avoid logging sensitive data
- Structure data for easy filtering
- Include timestamps for operations
- Track operation durations

9. Security Guidelines

- Never log sensitive information
- Sanitize user input in logs
- Mask sensitive patterns
- Validate log data
- Control log access

10. Implementation Example

```javascript
try {
    // Input validation
    if (!text || typeof text !== 'string') {
        logger.warn('Invalid input:', { text });
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    // Pattern matching
    const match = text.match(pattern);
    if (match) {
        logger.debug('Pattern match:', {
            pattern: pattern.source,
            match: match[0],
            index: match.index
        });

        // Value extraction
        const value = await extractValue(match);
        logger.debug('Value extracted:', { value });

        // Confidence calculation
        const confidence = calculateConfidence(match, text);
        logger.debug('Confidence calculated:', { confidence });

        return {
            type: 'success',
            value,
            metadata: {
                confidence,
                pattern: pattern.source,
                match: match[0]
            }
        };
    }

    logger.debug('No pattern match found');
    return null;

} catch (error) {
    logger.error('Parser error:', {
        error: error.message,
        stack: error.stack,
        input: text
    });
    return {
        type: 'error',
        error: 'PARSER_ERROR',
        message: error.message
    };
}
```

### State Management Standards

1. Action Creators:
   - Use descriptive action types
   - Include payload validation
   - Document expected payload shape
   - Handle edge cases

2. Selectors:
   - Pure functions only
   - Memoize complex computations
   - Document return types
   - Handle null states

3. State Updates:
   - Maintain immutability
   - Validate state changes
   - Handle errors gracefully
   - Log state transitions

4. Testing Requirements:
   - Action creator tests
   - Reducer tests
   - Selector tests
   - State validation tests
   - Error handling tests

### Parser Implementation Standards

1. File Structure and Module System

```javascript
// Required imports (must include .js extension)
import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';
import { DEFAULT_CONFIG as CONFIG } from '../../../config/parser.config.js';

// Logger initialization
const logger = createLogger('ParserName');

// Pattern definitions
const PATTERNS = {
    explicit: /pattern/,
    implicit: /pattern/,
    // ...
};

// Required exports (use named exports)
export const name = 'parsername';
export async function parse(text) { /* ... */ }

// For multiple exports, use export statement at end
export {
    helperFunction1,
    helperFunction2,
    // ...
};

// Helper functions
async function extractValue() { /* ... */ }
function calculateConfidence() { /* ... */ }
```

2. Required Components

- Named export for parser identification
- Async parse function with input validation
- Pattern definitions at module level
- Standardized error handling
- Confidence calculation
- Metadata generation

3. Error Handling Standards

```javascript
try {
    // Validation
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    // Processing
    // ...
} catch (error) {
    logger.error('Parser error:', error);
    return {
        type: 'error',
        error: 'PARSER_ERROR',
        message: error.message
    };
}
```

4. Return Format Standards

```javascript
// Success case
{
    type: 'parsertype',
    value: {
        // Parser-specific structure
    },
    metadata: {
        pattern: 'matched_pattern',
        confidence: 0.0-1.0,
        originalMatch: 'matched_text'
    }
}

// Error case
{
    type: 'error',
    error: 'ERROR_CODE',
    message: 'Human readable message'
}

// No match
null
```

### Test File Naming Standards

1. Test File Structure
   - Test files should match their implementation file names
   - Remove any prefixes or hyphens from the original implementation name
   - Maintain proper case sensitivity (e.g., timeOfDay.js → timeOfDay.test.js)
   - Always append .test.js to the base name

2. Examples:

   ```bash
   Implementation File    →  Test File
   action.js             →  action.test.js
   timeOfDay.js          →  timeOfDay.test.js
   categories.js         →  categories.test.js
   ```

3. Import Standards
   - Use relative paths from the test file to the implementation
   - Always include .js extension in import paths
   - Import specific exports using destructuring
   - Example:

   ```javascript
   import { name, parse } from '../../src/services/parser/parsers/timeOfDay.js';
   ```

4. Best Practices
   - Keep test files in a parallel directory structure to implementations
   - Use consistent naming across all test files
   - Maintain case sensitivity from the original implementation
   - Avoid prefixes or special characters in file names

## Next Steps

1. Short Term:
   - Optimize parser performance
   - Refine pattern matching
   - Enhance error handling
   - Improve test coverage

2. Medium Term:
   - Implement caching system
   - Enhance metadata
   - Improve confidence scoring
   - Optimize performance metrics

3. Long Term:
   - Add ML capabilities
   - Implement cloud features
   - Add collaboration tools
   - Create public API

## Known Issues

1. Parser System:
   - Pattern conflicts in complex texts
   - Performance with large texts
   - Memory usage optimization
   - Edge case handling

2. Integration:
   - Real-time parsing overhead
   - Result caching implementation
   - Performance optimization
   - API design considerations

## Timeline

Q1 2024:

- Complete parser optimization
- Implement caching system
- Enhance pattern matching
- Improve test coverage

Q2 2024:

- Implement cloud sync
- Enhance collaboration features
- Create public API
- Optimize performance metrics

Q3 2024:

- Add ML capabilities
- Implement mobile support
- Enhance security features
- Improve performance

Q4 2024:

- Complete cloud integration
- Add advanced features
- Enhance user experience
- Release stable version

## Project Structure

```bash
.
├── data/           # Application data and user settings
├── db/            # Database configuration and models
├── docs/          # Testing documentation
├── src/           # Application source code
│   ├── components/    # Reusable UI components
│   ├── config/       # Application configuration
│   ├── renderer/     # Renderer process
│   │   ├── editor/      # Editor components and logic
│   │   ├── entries/     # Entry management
│   │   ├── settings/    # Settings interface
│   │   ├── styles/      # CSS modules
│   │   ├── sync/        # Sync functionality
│   │   └── utils/       # Renderer utilities
│   ├── scripts/      # Utility scripts
│   ├── services/     # Core services
│   │   └── parser/      # Parser system
│   │       ├── formatters/  # Text formatting
│   │       ├── parsers/    # Individual parsers
│   │       └── utils/      # Parser utilities
│   └── utils/        # Shared utilities
└── tests/         # Test suite
    ├── parsers/      # Parser tests
    └── __mocks__/    # Test mocks
```

## Important Notes

### Module System

- All .js files use ES modules (import/export) by default
- Files with .cjs extension must use CommonJS
- File extensions (.js/.cjs) are required in all imports
- Preload scripts must use .cjs extension

Import/Export Standards:

- Use named exports instead of default exports
- Include .js extension in all import paths
- Use import aliases for clarity (e.g., `import { DEFAULT_CONFIG as CONFIG }`)
- Group multiple exports at the end of the file:

```javascript
export {
    function1,
    function2,
    constant1,
    // ...
};
```

CommonJS Usage:

- Limited to specific cases (preload scripts, certain Node.js modules)
- Must use .cjs extension to indicate CommonJS usage
- Example:

```javascript
// file: script.cjs
const { something } = require('./other.cjs');
module.exports = { /* exports */ };
```

### Data Persistence

- Uses JsonDatabaseService for storage
- Supports multiple content types
- Handles image attachments
- Provides backup/restore functionality
- Uses atomic operations

### Modal System

- Dynamic modal creation and removal
- Supports custom content and handlers
- Proper z-index management
- Full viewport editor support

## Technical Debt

- Need to refactor event listener management
- Improve error handling consistency
- Improve module organization
- Add comprehensive testing
- Document component architecture
- Refactor parser system
- Optimize database queries
- Improve file handling
- Enhance security measures
- Better error boundaries
- Improve code splitting
- Enhance build system
- Better dependency management
- Improve test infrastructure
- Enhance logging system
- Better code documentation
- Improve CI/CD process
- Enhance development workflow
- Better version control strategy
- Improve deployment process
- Enhance backup system
- Better data validation
- Improve error recovery
- Enhance user analytics
- Need to implement proper security measures
- Improve project structure organization
- Add comprehensive IPC validation
- Setup proper build configuration
- Implement proper test framework
