# Project State

PIM (Personal Information Manager) is designed to be a lightweight, fast, and efficient note-taking application. The focus is on simplicity and performance, using vanilla JavaScript without TypeScript or heavy frameworks. This approach ensures quick startup times and minimal resource usage.

## Recent Updates

### Parser Service Improvements

- Refactored the parser service and individual parsers, enhancing maintainability and organization
- Introduced standardized parser imports and improved performance tracking with parser statistics
- Enhanced individual parsers with refined patterns, error handling, and robust input validation
- Updated logging mechanisms across all parsers to ensure reliability and easier debugging

## Current Status

### Completed Features

1. Parser System:
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

2. Core Infrastructure:
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

3. UI Components:
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

### Parser Implementation

- Follow standardized structure
- Implement comprehensive tests
- Maintain consistent confidence scoring
- Provide rich metadata
- Handle errors gracefully
- Support async operations

### Testing Requirements

- Input validation tests
- Pattern matching tests
- Edge case coverage
- Error handling tests
- Confidence scoring tests
- Metadata validation

### Documentation

- API documentation
- Implementation guides
- Test coverage reports
- Performance metrics
- Usage examples

## Next Steps

1. Short Term:
   - Optimize parser performance
   - Refine pattern matching
   - Enhance error handling
   - Improve test coverage

2. Medium Term:
   - Implement caching system
   - Add plugin support
   - Enhance metadata
   - Improve confidence scoring

3. Long Term:
   - Add ML capabilities
   - Implement cloud features
   - Add collaboration tools
   - Create public API

## Known Issues

1. Parser System:
   - Pattern conflicts in complex texts
     - Overlapping patterns
     - Confidence conflicts
     - Context conflicts
   - Performance with large texts
     - Pattern matching overhead
     - Memory usage
     - Batch processing
   - Memory usage optimization
     - Pattern compilation
     - Result caching
     - Resource cleanup
   - Edge case handling
     - Invalid patterns
     - Incomplete matches
     - Context conflicts

2. Integration:
   - Real-time parsing overhead
   - Result caching implementation
   - Plugin system architecture
   - API design considerations

## Timeline

Q1 2024:

- Complete parser optimization
- Implement caching system
- Enhance pattern matching
- Improve test coverage

Q2 2024:

- Add plugin support
- Implement cloud sync
- Enhance collaboration features
- Create public API

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
├── docs/          # Plugin and testing documentation
├── src/           # Application source code
│   ├── components/    # Reusable UI components
│   ├── config/       # Application configuration
│   ├── plugins/      # Plugin system and custom plugins
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

- Improve plugin error handling and logging
- Need to refactor event listener management
- Consider moving to a state management system
- Improve error handling consistency
- Improve module organization
- Add comprehensive testing
- Document component architecture
- Refactor parser system
- Improve plugin architecture
- Enhance state management
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

## Parser System Standards

### Parser Implementation Standards

1. File Structure

```javascript
// Required imports
import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

// Logger initialization
const logger = createLogger('ParserName');

// Pattern definitions
const PATTERNS = {
    explicit: /pattern/,
    implicit: /pattern/,
    // ...
};

// Required exports
export const name = 'parsername';
export async function parse(text) { /* ... */ }

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

### Parser Test Standards

1. Test File Naming Standards

- Test files must match their source file name exactly, with `.test.js` appended
- Use camelCase to match source files (e.g., `timeOfDay.test.js` for `timeOfDay.js`)
- Do not include additional descriptors like "-parser" in the filename
- Always use `.test.js` extension (not `.tests.js`)

Example:

```bash
Source file: timeOfDay.js
Test file: timeOfDay.test.js
```

2. Test File Organization

```javascript
import { name, parse } from '../../src/services/parser/parsers/parser.js';

describe('Parser Name', () => {
    describe('Input Validation', () => {
        // Input validation tests
    });

    describe('Pattern Matching', () => {
        // Pattern-specific tests
    });

    describe('Confidence Scoring', () => {
        // Confidence tests
    });

    describe('Error Handling', () => {
        // Error case tests
    });
});
```

2. Required Test Categories

- Input validation
  - Null input
  - Empty string
  - Invalid types
  - Edge cases
- Pattern matching
  - Explicit patterns
  - Implicit patterns
  - Edge cases
  - Multiple matches
- Confidence scoring
  - Base confidence
  - Pattern modifiers
  - Position adjustments
  - Context factors
- Error handling
  - Invalid inputs
  - Parser errors
  - Edge cases
  - Error messages
- Metadata validation
  - Pattern information
  - Confidence values
  - Original matches
  - Context data

3. Test Case Standards

```javascript
test('descriptive test name', async () => {
    // Arrange
    const input = 'test input';
    
    // Act
    const result = await parse(input);
    
    // Assert
    expect(result).toEqual({
        type: 'expected_type',
        value: expect.any(Object),
        metadata: {
            pattern: expect.any(String),
            confidence: expect.any(Number),
            originalMatch: expect.any(String)
        }
    });
});
```

4. Test Coverage Requirements

- 100% coverage of parse function
- All pattern types tested
- All error cases covered
- Edge cases validated
- Confidence scoring verified
- Metadata generation confirmed

5. Test Documentation Standards

- Clear test descriptions
- Documented test cases
- Explained edge cases
- Coverage reports
- Performance metrics

### Confidence Scoring Standards

1. Base Confidence: 0.7

2. Pattern Modifiers:

```javascript
// Explicit patterns: +0.2
// Structured patterns: +0.15
// Contextual patterns: +0.1
// Implicit patterns: +0.05
```

3. Position Modifiers:

```javascript
// Start of text: +0.1
// After space: +0.05
// After punctuation: +0.05
```

4. Context Modifiers:

```javascript
// Multiple matches: +0.1
// Known context: +0.1
// User preference match: +0.1
```

Note: The project intentionally avoids TypeScript to maintain simplicity and reduce build complexity. Instead, we focus on clear code organization, comprehensive documentation, and thorough testing to ensure code quality.
