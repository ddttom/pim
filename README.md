# Personal Information Manager (PIM)

A modern desktop application for managing personal information, tasks, and notes with advanced natural language processing capabilities.

## Features

### Core Features

- Natural language input processing
- Smart date/time parsing
- Status tracking (None, Blocked, Complete, Started, Closed, Abandoned)
- Priority system (high, medium, low)
- Category tagging
- Advanced filtering capabilities
- Settings management system with UI configuration

### Natural Language Examples

#### Basic Tasks

```bash
Call John tomorrow at 2pm
Text Sarah about Project Alpha - blocked
Meet with team next week
Review code pull request #123 - complete
```

#### Status Updates

```bash
Call John - blocked by network issues
Email report - complete
Project review - started
Meeting notes - closed
Task X - abandoned
```

#### Date and Time

```bash
next week
tomorrow morning
now
at 2pm
```

#### Project References

```bash
Project Alpha meeting tomorrow
about project Big Launch
for Project X next week
```

### Parser Output Example

```javascript
// Input: "Call John about project Cheesecake next week - started"
{
  "raw_content": "Call John about project Cheesecake next week - started",
  "parsed": {
    "action": "call",
    "contact": "John",
    "project": {
      "project": "Cheesecake"
    },
    "final_deadline": "2024-02-02T09:00:00.000Z",
    "status": "Started"
  }
}
```

## Installation

1. Clone the repository:

```bash
git clone https://github.com/ddttom/pim.git
cd pim
```

2. Install dependencies:

```bash
npm install
```

3. Start the application:

```bash
npm start
```

## Usage

### Entry Management

- **Create Entry**: Click "New Entry" and type your task in natural language
- **Edit Entry**: Click the edit icon to modify an existing entry
- **Delete Entry**: Click the delete icon to remove an entry
- **View Details**: Click the expand icon to see full entry details

### Settings Management

The application includes a comprehensive settings management system accessible through a modal interface. Configure:

- Time periods (morning, afternoon, evening)
- Default times for different actions
- Default reminder intervals
- Status management preferences

Settings are automatically synchronized between:

- Parser configuration
- UI settings
- Stored preferences

### Status Management

Entries can have the following statuses:

- None (default)
- Blocked
- Complete
- Started
- Closed
- Abandoned

Status can be set by:

- Including in natural language text (e.g., "- blocked")
- Using the edit function

### Date Handling

The parser understands various date formats:

- Relative dates ("next week", "tomorrow")
- Time of day ("morning", "at 2pm")
- Immediate ("now")
- Default time is set to 9 AM for dates without specific times

### Projects

Projects can be specified in multiple formats:

- "Project X"
- "about project Y"
- "for Project Z"
- Multi-word project names are supported

## Development

### Running Tests

```bash
npm test
```

### Configuration

Status values and patterns are configured in `src/config/parser.config.js`:

```javascript
status: {
  values: ['None', 'Blocked', 'Complete', 'Started', 'Closed', 'Abandoned'],
  default: 'None',
  patterns: {
    'Blocked': [/\bblocked\b/i, /\bstuck\b/i],
    'Complete': [/\bcomplete\b/i, /\bfinished\b/i, /\bdone\b/i],
    'Started': [/\bstarted\b/i, /\bin progress\b/i, /\bbegun\b/i],
    'Closed': [/\bclosed\b/i, /\bended\b/i],
    'Abandoned': [/\babandoned\b/i, /\bcancelled\b/i, /\bdropped\b/i]
  }
}
```

For detailed configuration options and settings management, see `docs/config.md`.

## License

ISC License (ISC)

Copyright (c) 2024 Tom Cranstoun