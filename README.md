# PIM (Personal Information Manager)

A desktop application for managing personal information with rich text editing capabilities.

## Features

- Rich text editor with markdown support
- Multiple content types (Note, Document, Template, HTML)
- Collapsible sidebar for better workspace management
- Advanced settings management
- Customizable themes
- Keyboard shortcuts
- Search and filter capabilities
- Cloud sync support (coming soon)

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

## Usage

- Use the sidebar toggle (Filters button) to show/hide the sidebar
- Create new entries with Ctrl+N or the New Entry button
- Save entries with Ctrl+S
- Save As to change entry type (Note/Document/Template/HTML)
- Access settings via the gear icon or Ctrl+,
- Use keyboard shortcuts for common actions

## UI Features

- Streamlined toolbar with icon-only buttons and tooltips
- Content type badges showing current entry type
- Consistent button sizes and spacing
- Hover effects and visual feedback
- Modal dialogs for settings and Save As
- Proper z-index management for overlays
- Theme-aware styling throughout
- Smooth transitions for layout changes

## Keyboard Shortcuts

- `Ctrl+N`: New entry
- `Ctrl+S`: Save
- `Ctrl+F`: Search
- `Ctrl+,`: Settings
- `Ctrl+B`: Bold
- `Ctrl+I`: Italic
- `Ctrl+U`: Underline

## Documentation

- [User Manual](usermanual.md) - Guide for end users
- [Project Status](projectstate.md) - Current state and roadmap
- [Configuration](config.md) - Configuration system details
- [Plugin System](docs/plugin.md) - Plugin development guide
- [Testing](docs/test.md) - Test suite documentation
- [Contributing](CONTRIBUTING.md) - Development guidelines

## License

MIT
