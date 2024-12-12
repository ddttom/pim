# Project State

## Current State

The project is a Personal Information Manager (PIM) with natural language parsing capabilities. The application is built using Electron for the desktop interface.

### Core Components

#### Parser System

- Located in `src/services/parser/`
- Uses a plugin-based architecture for extensibility
- Handles various input patterns including:
  - Actions (call, email, meet, review, text)
  - Dates and times
  - Contacts
  - Projects
  - Priorities
  - Locations
  - Reminders

#### Settings System

Currently implementing a settings management system with:

- Modal-based settings UI
- Configuration for:
  - Time periods (morning, afternoon, evening)
  - Default times for different actions
  - Default reminder intervals
  - Status management

### Current Issues

#### Settings Form

1. Duplicate form content appearing in the settings modal
2. Settings retrieval from main process not working correctly
3. Form structure needs cleanup to prevent nesting issues

#### Configuration Management

1. Need to properly sync between:

- Parser configuration
- UI settings
- Stored preferences

### Next Steps

1. Fix Settings Form
   - Remove duplicate modal content
   - Ensure proper data flow between main and renderer
   - Clean up form structure

2. Configuration Integration
   - Integrate parser patterns with settings UI
   - Add validation for settings values
   - Implement proper save/load functionality

3. UI Improvements
   - Add proper error handling and user feedback
   - Improve form layout and responsiveness
   - Add input validation

## File Structure

```bash
src/
├── main.js                 # Main process
├── renderer/
│   ├── index.html         # Main UI
│   ├── renderer.js        # Renderer process
│   └── styles.css         # UI styles
├── services/
│   ├── database.js        # Data persistence
│   └── parser/
│       ├── core.js        # Parser core
│       ├── parsers/       # Individual parsers
│       └── utils/         # Parser utilities
└── utils/
    ├── dateUtils.js       # Date handling
    └── logger.js          # Logging system
```

## Current Focus

Working on the settings management system to provide a user-friendly interface for configuring the application's behavior, particularly focusing on the natural language parser's patterns and default values.
