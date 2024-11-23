# Personal Information Management System

## Core Architecture

- Electron for cross-platform desktop application
- Modern JavaScript (ES2022+) for UI implementation
- SQLite for persistent local storage
- AirBnB style guide compliance

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

Natural language input processing
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

Database Schema

sqlCopyCREATE TABLE entries (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  type TEXT,
  priority INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  due_date INTEGER,
  start_date INTEGER,
  end_date INTEGER,
  scheduled_date INTEGER,
  completed_date INTEGER,
  metadata JSON
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT,
  metadata JSON
);

CREATE TABLE links (
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  type TEXT NOT NULL,
  strength REAL DEFAULT 1.0,
  metadata JSON,
  PRIMARY KEY (source_id, target_id)
);

CREATE TABLE views (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config JSON NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE filters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  conditions JSON NOT NULL,
  created_at INTEGER NOT NULL
);

Core Types

copyInterface Entry {
  id: string;
  content: string;
  type?: string;
  priority: Priority;
  dates: EntryDates;
  categories: string[];
  links: Link[];
  metadata: Record<string, any>;
}

interface View {
  id: string;
  name: string;
  columns: ViewColumn[];
  filters: ViewFilter[];
  sorts: ViewSort[];
  layout: ViewLayout;
  settings: ViewSettings;
}

interface Filter {
  id: string;
  type: 'date' | 'priority' | 'category' | 'custom';
  condition: FilterCondition;
  value: any;
}

Implementation Requirements

Follow modern javascript best practices
Implement proper error handling
Follow the repository pattern for data access
Implement service layer for business logic
Use dependency injection where appropriate
Include unit tests for core functionality
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
