# Personal Information Management System

## Core Architecture

- Electron for cross-platform desktop application
- Modern JavaScript (ES2022+) for UI implementation, never use typescript
- SQLite for persistent local storage

## Project Structure

src/
├── main/               # Electron main process
│   ├── index.ts
│   ├── ipc/
│   └── services/
├── renderer/          # Electron renderer
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   └── store/
├── shared/           # Shared types/utils
└── db/              # Database schemas
Core Dependencies

electron
sqlite3

Key Features to Implement

Data Entry System

Natural language input processing, markdown text
Quick entry field
File attachment support
Image import with metadata
Email integration
Calendar sync

Data Organization

Priority system (None, Low, Medium, High, Urgent)
Multiple date types (due, start, end, scheduled, completed)
Categories and tags
Bi-directional linking
Custom metadata fields

View System

Tab-based interface
Customizable columns
Multiple layouts (table, card, timeline, calendar, network)
Column sorting and visibility
View saving and sharing
Print view functionality

Filter System

Smart date filters ("without date", "due this week", etc.)
Priority filters
Category filters
Combined conditions
Filter presets
Custom filter ranges

Tab Management

Multiple simultaneous views
State persistence
Tab-specific filters
History tracking
Quick switching

Print System

Multiple formats (detailed, compact, list, summary)
Paper size options
Content inclusion toggles
Headers and footers
Custom styling

Implementation Requirements

Follow modern javascript best practices
Implement proper error handling
Follow the repository pattern for data access
Implement service layer for business logic
Use dependency injection where appropriate
Follow event-driven architecture for updates
Implement proper logging and monitoring
Use async/await for asynchronous operations

Performance Requirements

Application startup < 3 seconds
Search response time < 500ms
Smooth scrolling at 60fps
Memory usage < 500MB
Efficient data caching
Batch operations for bulk changes

Error Handling

Implement comprehensive error catching
User-friendly error messages
Error logging system
Automatic error recovery where possible
Crash reporting System
