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

### Module System

- All .js files use ES modules (import/export) by default due to "type": "module" in package.json
- Files with .cjs extension must use CommonJS (require/module.exports)
- Preload scripts must use .cjs extension to ensure proper IPC communication
- File extensions (.js/.cjs) are required in all imports
- Incorrect module syntax will break functionality:
  - ES modules won't work in .cjs files
  - CommonJS won't work in .js files
  - Missing file extensions will cause import failures

[Rest of the file content remains unchanged...]
