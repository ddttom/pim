# PIM (Personal Information Manager)

A desktop application for managing personal information with rich text editing capabilities, using modern JavaScript and CSS, no TypeScript or frameworks requiring build, except for Electron.

For detailed product requirements and specifications, see [Product Requirements](prd.md).

## Screenshots

### Main Interface

![Main Interface](docs/images/main app screen.png)

### Settings

![Settings](docs/images/settings modal.png)

### Sidebar Navigation

![Sidebar](docs/images/sidebar showing on main.png)

## Key Features

- Rich text editor with Markdown support
- Multiple content types (Notes, Documents, Tasks, etc.)
- Entry organization and archiving
- Advanced search and filtering
- Customizable themes
- Keyboard-driven interface
- Cloud sync (coming soon)

For complete feature details, see [User Manual](usermanual.md).

## Installation

```bash
# Install dependencies
npm install

# Run tests to verify setup
npm test

# Start the application
npm start
```

## Project Structure

```bash
src/
├── config/           # Configuration management
├── plugins/          # Plugin system
├── renderer/         # Frontend UI components
│   ├── editor/      # Rich text editor
│   ├── entries/     # Entry management
│   ├── settings/    # Settings UI
│   ├── styles/      # Component-specific styles
│   │   ├── base.css     # Core variables and reset
│   │   ├── ribbon.css   # Header styles
│   │   ├── sidebar.css  # Navigation styles
│   │   ├── entries.css  # Entry list styles
│   │   ├── editor.css   # Editor styles
│   │   ├── modals.css   # Modal and toast styles
│   │   ├── theme.css    # Theme variables
│   │   └── index.js     # Style loader
│   ├── sync/        # Sync functionality
│   └── utils/       # Utility functions
├── services/        # Core services
│   └── parser/      # Text parsing system
└── utils/           # Shared utilities

tests/
├── __mocks__/       # Mock implementations
├── parsers/         # Parser-specific tests
└── setup.js         # Test environment setup
```

## Development

### Testing

The project includes comprehensive test suites:

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

### Building

```bash
# Build the application
npm run build

# Run in development mode
npm run dev
```

### Styling

The application uses a modular CSS system:

- Each component has its own CSS file for better maintainability
- Base variables and reset styles are centralized
- Theme system supports light/dark modes
- Dynamic style loading with smooth transitions
- Proper z-index management for overlays

## Quick Start Guide

1. Create entries with `Ctrl+N` or the New Entry button
2. Use the rich text editor to write content
3. Save with `Ctrl+S`
4. Organize entries using the sidebar filters
5. Search content with `Ctrl+F`
6. Access settings with `Ctrl+,`

For complete keyboard shortcuts and features, see [User Manual](usermanual.md).

## Documentation

- [User Manual](usermanual.md) - Guide for end users
- [Project Status](projectstate.md) - Current state and roadmap
- [Configuration](config.md) - Configuration system details
- [Plugin System](docs/plugin.md) - Plugin development guide
- [Testing](docs/test.md) - Test suite documentation
- [Contributing](CONTRIBUTING.md) - Development guidelines

## License

MIT
