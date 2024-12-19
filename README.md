# PIM (Personal Information Manager)

A desktop application for managing personal information with rich text editing capabilities.

## Features

- Rich text editor with markdown support
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

## Usage

- Use the sidebar toggle (←/→) to collapse/expand the sidebar
- Create new entries with Ctrl+N or the New Entry button
create - Save entries with Ctrl+S
- Access settings via the gear icon or Ctrl+,
- Use keyboard shortcuts for common actions

## Keyboard Shortcuts

- `Ctrl+N`: New entry
- `Ctrl+S`: Save
- `Ctrl+F`: Search
- `Ctrl+,`: Settings
- `Ctrl+\`: Toggle sidebar
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
