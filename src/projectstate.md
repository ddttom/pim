# Project State

PIM (Personal Information Manager) is designed to be a lightweight, fast, and efficient note-taking application. The focus is on simplicity and performance, using vanilla JavaScript without TypeScript or heavy frameworks. This approach ensures quick startup times and minimal resource usage.

## Recent Updates

### Parser Service Improvements

- Refactored the parser service and individual parsers, enhancing maintainability and organization
- Introduced standardized parser imports and improved performance tracking with parser statistics
- Enhanced individual parsers with refined patterns, error handling, and robust input validation
- Updated logging mechanisms across all parsers to ensure reliability and easier debugging

## Documentation

- [User Manual](usermanual.md) - Guide for end users
- [Project Status](projectstate.md) - Current state and roadmap
- [Configuration](config.md) - Configuration system details
- [Plugin System](docs/plugin.md) - Plugin development guide
- [Testing](docs/test.md) - Test suite documentation
- [Contributing](CONTRIBUTING.md) - Development guidelines

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
  - Parser system with specialized parsers
  - Database and configuration management
  - Entry and settings services
  - Logging and utilities
- Plugins system
  - Custom plugin support

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

## Recently Completed

- Added entry archiving system
  - Archive/unarchive functionality
  - Archived entries filter in sidebar
  - Visual distinction for archived entries
  - Archive status preserved in database
  - Proper handling in UI components
- Enhanced content types system
  - Added Record type for structured data
  - Added Task type for actionable items
  - Added Event type for calendar entries
  - Type-specific styling and badges
  - Type filtering in sidebar
  - Type preservation during save/duplicate
  - Save As functionality for type conversion
  - Comprehensive test coverage
  - Updated documentation
- Improved modal system
  - Replaced static modals with dynamic creation/removal
  - Added Modal class for consistent implementation
  - Improved memory usage by removing unused DOM elements
  - Added support for custom content and buttons
  - Implemented proper z-index management
  - Added background scroll prevention
  - Added positioned modals for context actions
  - Fixed modal layering and visibility
  - Added scrollbars for overflow content
  - Made editor modal use full viewport
- Fixed startup behavior
  - Entries list now shows by default
  - Editor initializes on-demand
  - Improved initial load performance
- Improved module organization
  - Converted renderer files to ES modules
  - Fixed module syntax inconsistencies
  - Improved error handling
  - Added proper async/await usage
- Enhanced image handling
  - Added date-based image storage organization
  - Implemented image staging with preview links
  - Added proper file cleanup and error handling
  - Improved user feedback for image uploads

## In Progress

- Cloud sync implementation
- Advanced theme customization
- Filter and sort functionality
- Rich text editor improvements
- Mobile responsiveness improvements
- Dark theme refinements
- Entry categorization system
- Advanced search capabilities
- Performance optimization
- Plugin system enhancements
- Testing coverage expansion
- Documentation improvements
- Error handling refinements
- State management improvements
- UI/UX enhancements
- Security hardening
  - Context isolation implementation
  - Node integration controls
  - CSP headers setup
- Project structure reorganization
  - Main and renderer process separation
  - Environment configuration setup
  - Build system configuration

## Up Next

- Backup/restore system
- Search improvements
- Performance optimizations
- Offline support
- Plugin system enhancements
- Keyboard shortcut customization
- Advanced entry filtering
- Tag system implementation
- Multi-device sync
- Cloud backup integration
- Advanced theme editor
- Import/export system
- External service integration
- Advanced plugin API
- Mobile app development
- Desktop app improvements
- Security enhancements
- Accessibility features
- Collaboration features
- Version control system
- Advanced analytics
- Automated testing
- CI/CD pipeline
- Documentation portal
- Community features
- API development
- IPC Communication improvements
  - Message validation
  - Channel cleanup
  - Preload script security
- Testing framework expansion
  - Unit test coverage
  - Integration tests
  - Performance benchmarks

## Known Issues

- Plugin error handling needs improvement
- Editor state management needs improvement
- Filter dropdown positioning needs work
- Mobile layout needs optimization
- Dark theme contrast issues in some components
- Search performance needs improvement
- Memory usage optimization needed
- Some UI elements need better accessibility
- Plugin system needs better error handling
- Sync conflicts need better resolution
- Some keyboard shortcuts conflict
- Theme transitions need smoothing
- Entry parser needs optimization
- Some modal animations are jerky
- Settings backup needs improvement
- Error messages need better clarity
- Some state updates are inconsistent
- Test coverage is incomplete
- Documentation needs expansion
- Security configuration needs review
- IPC channels need proper validation
- Missing proper preload script implementation
- Test coverage is incomplete
- Build configuration needs setup

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
- Improve modal system to use dynamic creation/removal for better performance and memory usage

Note: The project intentionally avoids TypeScript to maintain simplicity and reduce build complexity. Instead we focus on clear code organization through consistent module usage (ES modules for renderer process, CommonJS for preload scripts), comprehensive documentation and thorough testing to ensure code quality. The project continues to maintain its focus on simplicity and performance while addressing core security and structural needs identified in the code review checklist.
