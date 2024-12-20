# Project State

PIM (Personal Information Manager) is designed to be a lightweight, fast, and efficient note-taking application. The focus is on simplicity and performance, using vanilla JavaScript without TypeScript or heavy frameworks. This approach ensures quick startup times and minimal resource usage.

## Documentation

- [User Manual](usermanual.md) - Guide for end users
- [Project Status](projectstate.md) - Current state and roadmap
- [Configuration](config.md) - Configuration system details
- [Plugin System](docs/plugin.md) - Plugin development guide
- [Testing](docs/test.md) - Test suite documentation
- [Contributing](CONTRIBUTING.md) - Development guidelines

## Important Notes

### Module Syntax Requirements

- Renderer process files (.js) use ES modules (import/export)
- Preload scripts (.js) must use CommonJS (require/module.exports)
- Main process files can use either syntax based on package.json "type"
- Incorrect syntax in preload scripts will break IPC communication

### Data Persistence

- Uses JsonDatabaseService for persistent storage
- Stores data in user's application data directory
- Supports CRUD operations for entries
- Supports multiple content types (Note, Document, Template, HTML, Record, Task, Event)
- Only Note type entries are parsed for metadata
- Legacy entries without type are treated as Notes
- Handles image attachments with media directory
- Provides backup/restore functionality
- Uses atomic operations with rollback support
- Maintains proper timestamps for entries
- Supports batch operations
- Implements proper error handling

## UI Design

The application features a clean, modern interface designed for efficiency and ease of use:

### Main Interface

![Main Interface](docs/images/main app screen.png)

The main window is organized into three primary sections:

1. Top Ribbon
   - PIM logo and branding in top-left
   - Primary action buttons: "New Entry" and "Filters"
   - Utility buttons in top-right: "Copy DB" and "Settings"
   - Clean, minimal design with consistent spacing

2. Left Sidebar
   - Collapsible panel with smooth animation
   - Filter sections:
     - "All Entries" at the top
     - "Overdue" with red highlight
     - Priority filters (High/Normal/Low) with color coding
     - Type filters for each content type (Note/Document/Template/HTML/Record/Task/Event)
     - Categories section with Projects and Tags
   - Subtle borders and consistent padding
   - Clear visual hierarchy with section headers

3. Main Content Area
   - Search bar at the top with placeholder text
   - Data table with columns:
     - Content (expandable text)
     - Type (Note/Document/Template/HTML/Record/Task/Event)
     - Date (sortable)
     - Project (optional)
     - Priority (color-coded)
     - Tags (comma-separated)
     - Deadline (highlighted for urgency)
   - Clean row styling with hover states
   - Consistent typography and spacing

### Settings Modal

![Settings Modal](docs/images/settings modal.png)

A comprehensive settings dialog with clear organization:

1. Editor Section
   - Auto-save toggle for entries
   - Spell check enable/disable
   - Clean checkbox styling

2. Display Options
   - Theme selector (Light/Dark)
   - Font size slider with live preview
   - Font family dropdown with system defaults
   - Date format selector with examples
   - Consistent form control styling

3. Cloud Sync Configuration
   - Enable/disable sync toggle
   - Provider selection dropdown
   - Auto sync toggle
   - Sync interval selector
   - Clear grouping and layout

4. Backup Controls
   - Create/Restore backup buttons
   - Simple, action-focused layout
   - Clear visual feedback

### Theme Implementation

![Sidebar View](docs/images/sidebar showing on main.png)

Sophisticated theming system with attention to detail:

1. Light Theme (Default)
   - Clean white backgrounds
   - Subtle gray accents
   - High contrast for text
   - Blue primary actions
   - Consistent color palette

2. Dark Theme
   - Deep gray backgrounds
   - Light gray accents
   - Carefully chosen contrast ratios
   - Adjusted color palette for readability
   - Preserved visual hierarchy

3. Common Features
   - Smooth transitions between themes
   - Consistent spacing and typography
   - Proper contrast ratios for accessibility
   - Unified color variables
   - Coherent visual language

## Recently Completed

- Improved CSS organization and maintainability
  - Split monolithic styles.css into component-specific files
  - Created modular CSS loading system
  - Organized styles by component (base, ribbon, sidebar, entries, editor, modals)
  - Added dynamic theme management
  - Improved style isolation and maintainability
- Enhanced sidebar and layout behavior
  - Improved sidebar slide animation
  - Fixed entries table width adjustments
  - Added smooth transitions for layout changes
  - Optimized z-index hierarchy
  - Fixed content overlap issues
- Added content type system
  - Added support for Notes, Documents, Templates, HTML, Records, Tasks, and Event types
  - Implemented "Save As" functionality in editor
  - Added type filtering in sidebar
  - Only Notes are parsed for metadata
  - Backward compatible with existing entries
- Improved date parsing system
  - Added generic "last day of" expressions
  - Added support for week/month/year periods
  - Fixed next weekday calculations
  - Added proper regex pattern matching
  - Improved date handling accuracy
  - Added comprehensive error handling
- Improved test coverage and reliability  
  - Added proper mock implementations
  - Improved test directory management
  - Enhanced image upload testing
  - Fixed configuration test validation
- Added collapsible sidebar with arrow toggle
- Improved sidebar UI with immediate collapse/expand
- Added settings modal with proper organization
- Fixed event listener conflicts
- Removed redundant sync/backup buttons from toolbar
- Improved keyboard shortcuts
- Fixed sidebar collapse/expand icon visibility
- Moved settings to modal dialog
- Added proper ES module support
- Improved settings persistence with file storage
- Implemented basic entry management
- Added rich text editor integration
- Created basic UI framework
- Set up Electron project structure
- Added basic file handling
- Implemented settings system
- Created entry parser system
- Added basic search functionality
- Implemented basic theme support
- Added keyboard shortcut system
- Created plugin architecture
- Implemented basic backup system
- Added toast notifications
- Created modal system
- Implemented basic sync framework
- Added basic error handling
- Created logging system
- Implemented basic state management
- Added basic testing framework
- Created documentation structure
- Improved sidebar collapse/expand functionality
  - Added immediate collapse without transitions
  - Updated toggle arrows (← →) for better clarity
  - Fixed toggle button positioning
- Removed redundant UI elements
  - Removed "Entries" heading from sidebar
  - Removed sync/backup buttons from toolbar
  - Right-aligned settings button
- Code organization improvements
  - Added ConfigManager for centralized configuration
  - Improved test coverage for parser and database
  - Added proper error handling in services
- Fixed z-index and tooltip issues
  - Identified overlapping z-index problems with modals, tooltips and editor
  - Standardized z-index hierarchy:
    - Base editor components: z-index 1
    - Tooltips: z-index 1000
    - Modals backdrop: z-index 99999
    - Modal content: z-index 100000
    - Modal buttons: z-index 100001
  - Fixed tooltip visibility issues
    - Switched from custom data-tooltip to native title attribute
    - Added proper arrow indicators
    - Improved tooltip styling and positioning
    - Made tooltips match app theme variables
  - Improved button interactions
    - Added hover states
    - Increased touch targets to 40x40px
    - Made icons more prominent
    - Added consistent spacing

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

Note: The project intentionally avoids TypeScript to maintain simplicity and reduce build complexity. Instead, we focus on clear code organization, comprehensive documentation, and thorough testing to ensure code quality. The project continues to maintain its focus on simplicity and performance while addressing core security and structural needs identified in the code review checklist.
