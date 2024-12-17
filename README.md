# Personal Information Manager (PIM)

A modern desktop application for managing personal information, tasks, and notes with advanced natural language processing capabilities.

## Features

### Core Features

- Natural language input processing with fuzzy matching
- Smart date/time parsing with misspelling support
- Context-aware task categorization
- Multi-level priority system
- Advanced filtering and sorting
- Comprehensive settings management
- Transaction-safe JSON storage

### Natural Language Examples

#### Basic Tasks

```bash
# Simple Tasks
Call John tomorrow at 2pm
Meet with team in conference room
Email Sarah about Project Alpha

# With Misspellings (Still Works!)
Meeting next wednsday with team
Call Jim on thurdsay morning
```

#### Advanced Features

```bash
# Time and Location
Meet John at Starbucks tomorrow morning
Call team at 3pm in the conference room

# Duration and Recurrence
Review code for 2 hours
Team sync every Monday at 10am

# Context and Priority
Email finance report #urgent #finance
Schedule doctor appointment #health

# With Participants
Project review with @sarah and @mike
Team meeting with @dev-team
```

### Parser Features

#### Time Understanding

- Smart date parsing with common misspellings
- Time of day defaults:
  - Morning: 9:00 AM
  - Noon: 12:00 PM
  - Afternoon: 2:00 PM
  - Evening: 6:00 PM
  - Night: 8:00 PM

#### Context Detection

- Work: meetings, projects, deadlines
- Personal: family, shopping, home
- Health: doctor, gym, medicine
- Finance: bank, payments, budget

#### Action Recognition

- Basic: call, meet, email, review, write
- Variations: phone, sync, mail, check
- Fuzzy matching for misspellings

#### Additional Features

- Location detection ("at" or "in" locations)
- Duration parsing (hours and minutes)
- Recurrence patterns (daily, weekly, monthly)
- Priority levels (high, normal)
- Status tracking (pending, complete)
- Project references
- Participant mentions (@person)
- Category tags (#tag)

### Storage Format

```javascript
{
  "id": "uuid",
  "created_at": "2024-12-16T18:45:43.824Z",
  "updated_at": "2024-12-16T18:45:43.824Z",
  "raw_content": "Call John about project Cheesecake tomorrow morning",
  "parsed": {
    "action": "call",
    "contact": "John",
    "project": {
      "project": "Cheesecake"
    },
    "final_deadline": "2024-12-17T09:00:00.000Z",
    "participants": [],
    "tags": [],
    "priority": "normal",
    "status": "pending",
    "location": null,
    "duration": null,
    "recurrence": null,
    "contexts": [],
    "categories": []
  },
  "plugins": {}
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

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:config    # Test configuration system
npm run test:db        # Test database operations
npm run test:parser    # Test parser functionality
npm run test:parser-persist  # Test parser-database integration
```

### Project Structure

```bash
/src
├── config
│   ├── ConfigManager.js
│   └── parser.config.js
├── db
│   └── models
├── main
├── main.js
├── plugins
│   ├── customPlugin.js
│   ├── locationPlugin.js
│   └── pluginManager.js
├── renderer
│   ├── index.html
│   ├── renderer.js
│   └── styles.css
├── scripts
├── services
│   ├── config.js
│   ├── entry-service.js
│   ├── json-database.js
│   ├── logger.js
│   ├── parser
│   │   ├── core.js
│   │   ├── formatters
│   │   │   └── emoji.js
│   │   ├── index.js
│   │   ├── parsers
│   │   │   ├── action.js
│   │   │   ├── attendees.js
│   │   │   ├── categories.js
│   │   │   ├── complexity.js
│   │   │   ├── contact.js
│   │   │   ├── date.js
│   │   │   ├── dependencies.js
│   │   │   ├── duration.js
│   │   │   ├── links.js
│   │   │   ├── location.js
│   │   │   ├── priority.js
│   │   │   ├── project.js
│   │   │   ├── recurring.js
│   │   │   ├── reminders.js
│   │   │   ├── status.js
│   │   │   ├── subject.js
│   │   │   ├── time.js
│   │   │   ├── timeOfDay.js
│   │   │   └── urgency.js
│   │   └── utils
│   │       ├── dateUtils.js
│   │       ├── patterns.js
│   │       ├── timeUtils.js
│   │       └── validation.js
│   ├── parser.js
│   └── settings-service.js
├── types
│   └── models.ts
└── utils
    ├── dateUtils.js
    └── logger.js 
```

### Configuration

The application uses a multi-layered configuration system:

1. Environment Variables (highest priority)
2. Settings File (settings.json)
3. User Config File (config.json)
4. Default Values (lowest priority)

For detailed configuration options, see `docs/config.md`.

## License

ISC License (ISC)

Copyright (c) 2024 Tom Cranstoun
