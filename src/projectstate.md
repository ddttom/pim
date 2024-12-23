# Project State

PIM (Personal Information Manager) is designed to be a lightweight, fast, and efficient note-taking application. The focus is on simplicity and performance, using vanilla JavaScript without TypeScript or heavy frameworks. This approach ensures quick startup times and minimal resource usage.

## Recent Updates

### Parser Service Improvements

- Enhanced individual parsers with refined patterns, error handling, and robust input validation
- Updated logging mechanisms across all parsers to ensure reliability and easier debugging
- Standardized confidence scoring across all parsers (0.95-0.75 range)

### Parser Testing Guidelines

- Confidence comparisons should use inclusive operators (`>=`, `<=`) instead of strict comparisons
- High confidence: `>= 0.9`
- Medium confidence: `>= 0.8`
- Low confidence: `<= 0.8`
- Invalid/uncertain matches: `<= 0.7`

### Parser Construction Guidelines

All parsers in the system follow a standardized template (base.js) to ensure consistency:

```javascript
// 1. Required imports and logger initialization
import { createLogger } from '../../../utils/logger.js';
const logger = createLogger('ParserName');

// 2. Parser name export
export const name = 'parsername';

// 3. Main parse function
export async function parse(text) {
    // Input validation
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    // Pattern definitions by confidence level
    const patterns = {
        explicit_pattern: /pattern1/i,    // 0.95 confidence
        standard_pattern: /pattern2/i,    // 0.90 confidence
        implicit_pattern: /pattern3/i     // 0.80 confidence
    };

    // Pattern matching and result generation
    // ... implementation details in parsers.md
}
```

Key Requirements:

- Must return error object for invalid input
- Must use standardized confidence levels (0.95-0.75)
- Must include pattern, confidence, and originalMatch in metadata
- Must return null for no matches
- Must follow single/multi-match return format

See [Parser Standards](parsers.md) for complete implementation details.

## Documentation

- [User Manual](usermanual.md) - Guide for end users
- [Project Status](projectstate.md) - Current state and roadmap
- [Configuration](config.md) - Configuration system details
- [Parser Standards](parsers.md) - Parser implementation standards and guidelines
- [Plugin System](docs/plugin.md) - Plugin development guide
- [Testing](docs/test.md) - Test suite documentation
- [Contributing](CONTRIBUTING.md) - Development guidelines

## Project Structure

```bash
.
���������── data/           # Application data and user settings
├── db/            # Database configuration and models
├── docs/          # Plugin and testing documentation
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
│   ├─�� scripts/      # Utility scripts
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

### Directory Overview

### Root Directory

- Configuration files (.gitattributes, .gitignore, .hintrc, .markdownlint.json)
- Build configuration (babel.config.cjs, jest.config.cjs, jest.setup.js)
- Documentation (README.md, CONTRIBUTING.md, config.md, parsers.md, usermanual.md)
- Package management (package.json, package-lock.json)

### Source Code (/src)

- Main process files (main.js, main.cjs)
- Preload scripts (preload.js, preload.cjs)
- Components
  - Sidebar and UI elements
- Configuration
  - ConfigManager and parser configuration
- Renderer process
  - Editor components and modals
  - Entry management
  - Settings interface
  - Styles (CSS modules)
  - Sync functionality
  - Utility functions
- Services
  - Parser System
    - Core Parser Service (index.js)
    - Standardized Parsers
      - Text Analysis
        - Subject Parser (subject.js)
        - Tags Parser (tags.js)
        - Categories Parser (categories.js)
      - Time & Scheduling
        - Date Parser (date.js)
        - Time Parser (time.js)
        - Duration Parser (duration.js)
        - Recurring Parser (recurring.js)
        - TimeOfDay Parser (timeOfDay.js)
      - Task Management
        - Priority Parser (priority.js)
        - Status Parser (status.js)
        - Complexity Parser (complexity.js)
      - People & Communication
        - Attendees Parser (attendees.js)
        - Participants Parser (participants.js)
        - Contact Parser (contact.js)
      - Project Organization
        - Project Parser (project.js)
        - Dependencies Parser (dependencies.js)
        - Links Parser (links.js)
        - Location Parser (location.js)
      - Notifications & Reminders
        - Reminders Parser (reminders.js)
        - Urgency Parser (urgency.js)
      - Context & Metadata
        - Contexts Parser (contexts.js)
    - Parser Infrastructure
      - Base Parser Template (base.js)
      - Pattern Utilities (utils.js)
      - Shared Patterns (patterns.js)
  - Database and configuration management
  - Entry and settings services
  - Logging and utilities

### Data and Configuration

- /data - Application data and settings
- /db - Database configuration
- /config - Application configuration

### Testing

- Unit tests for parsers
- Mock implementations
- Test configuration and setup
- Plugin testing
- Renderer testing

### Documentation 2

- /docs - Detailed documentation
  - Plugin development guide
  - Testing documentation

Note: The project maintains a clear separation between main process, renderer process, and preload scripts, following Electron's security best practices while keeping the architecture simple and maintainable.

## Important Notes

### Module System

- All .js files use ES modules (import/export) by default due to "type": "module" in package.json
- Files with .cjs extension must use CommonJS (require/module.exports)
- Preload scripts must use .cjs extension to ensure proper IPC communication
- File extensions (.js/.cjs) are required in all imports
- Incorrect module syntax will break functionality:
  - ES modules won't work in .cjs files
  - CommonJS won't work in .js files
  - Missing file extensions will cause import failures

### Parser Template

All parsers in the project follow a standardized template (base.js) to ensure consistency and maintainability:

#### Structure

- Module-level pattern definitions for performance
- Standardized export with name and parse methods
- Consistent error handling and logging
- Pattern validation and confidence scoring

#### Key Components

- Input validation at entry point
- Pattern matching with prioritization
- Value extraction and transformation
- Confidence calculation
- Detailed error logging and metadata

#### Required Methods

- parse(text): Main entry point with input validation
- extractValue(match): Transform matched content
- calculateConfidence(match, fullText): Score match quality

#### Error Handling

- Structured error objects with type and message
- Input validation at entry point
- Graceful handling of edge cases
- Detailed error logging with context

#### Metadata Generation

- Pattern identification
- Confidence scoring
- Original match preservation
- Pattern-specific information

Note: When creating new parsers or updating existing ones, always use this template to maintain consistency and ensure proper error handling, logging, and metadata generation.

### Data Persistence

- Uses JsonDatabaseService for persistent storage
- Stores data in user's application data directory
- Supports CRUD operations for entries
- Supports multiple content types:
  - Note (default) - For general note-taking
  - Document - For formatted documents
  - Template - For reusable templates
  - HTML - For web content
  - Record - For structured data
  - Task - For actionable items
  - Event - For calendar events
- Only Note type entries are parsed for metadata
- Legacy entries without type are treated as Notes
- Handles image attachments:
  - Date-based directory organization (YYYY-MM-DD)
  - Preview links for staged images
  - Automatic cleanup of temporary files
- Provides backup/restore functionality
- Uses atomic operations with rollback support
- Maintains proper timestamps for entries
- Supports batch operations
- Implements proper error handling

### Modal System

- Dynamic modal creation and removal
- Modals are created on-demand and removed from DOM when closed
- Supports custom content buttons and event handlers
- Consistent styling and behavior across all modals
- Built-in support for:
  - Settings configuration
  - Parser test results
  - Save As type selection
  - Custom modals for plugins
- Features:
  - Backdrop click to close
  - Keyboard escape to close
  - Custom width and height
  - Scrollable content
  - Primary/secondary button styles
  - SVG icon support
  - Proper z-index management
  - Background scroll prevention
  - Positioned modals for context-specific actions
  - Full viewport editor modal
  - Automatic scrollbars for overflow content

Note: The project intentionally avoids TypeScript to maintain simplicity and reduce build complexity. Instead we focus on clear code organization through consistent module usage (ES modules for renderer process, CommonJS for preload scripts), comprehensive documentation and thorough testing to ensure code quality. The project continues to maintain its focus on simplicity and performance while addressing core security and structural needs identified in the code review checklist.
