# Personal Information Manager (PIM)

A modern desktop application for managing personal information, tasks, and notes with advanced natural language processing capabilities.

## Features

### Core Features

- Natural language input processing
- Multiple view options (Table, Cards, Timeline)
- Priority system
- Category tagging
- Smart date parsing
- Filtering capabilities

### Advanced Parsing Features

- Complex meeting and event scheduling
- Team and attendee management
- Project and context tracking
- Location detection (office, online, travel)
- Reminder and follow-up system
- Status and progress tracking
- Dependencies and blockers
- Subject and hashtag support

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/pim.git
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

### Basic Usage

1. Click the "New Entry" button to create a new entry
2. Enter your note in natural language
3. Select a priority level (optional)
4. Click "Save" to store your entry

### Natural Language Examples

#### Basic Tasks

- "Call John tomorrow at 2pm"
- "Email Sarah about the report by Friday"
- "Review code pull request #123"
- "Text Mike about lunch meeting"

#### Meetings

- "Meeting with team Engineering Monday 10am"
- "Weekly standup every Monday at 9am"
- "Zoom call with client tomorrow 2pm"
- "Quick sync with Sarah in 30 minutes"

#### Complex Tasks

```sh
urgent zoom meeting with John and team Engineering 
about Q4 Planning #strategy tomorrow at 10am 
for 2 hours, remind me 30 minutes before
```

```sh
review code for Project Alpha $frontend 
after deployment is complete, blocked by QA testing
```

```sh
team meeting every monday morning at 9am in the office
with Sarah and Mike about sprint planning
```

#### Follow-ups and Dependencies

- "Follow up with John in 2 days"
- "Check back after deployment is complete"
- "Reminder about project status next week"
- "Schedule review once testing is done"

## Natural Language Understanding

### Time Expressions

#### Absolute Dates

- "tomorrow at 2pm"
- "next Monday"
- "January 15th"
- "2024-01-15"

#### Relative Dates

- "in 2 hours"
- "next week"
- "end of month"
- "beginning of next quarter"

#### Recurring Patterns

- "every Monday"
- "daily at 9am"
- "weekly team sync"
- "monthly review"

### Priority Levels

- **High**: "urgent", "asap", "important"
- **Medium**: "normal", "moderate"
- **Low**: "whenever", "low priority"

### Location Types

- **Office**: "in the office", "Room 123"
- **Online**: "zoom", "teams", "virtual"
- **Travel**: "at client site", "in New York"

### Project Management

#### Context Tags

- Technical: "$frontend", "$api", "$mobile"
- General: "#urgent", "#blocked", "#review"

#### Progress Tracking

- "50% complete"
- "blocked by deployment"
- "waiting for review"

### Team Collaboration

#### Attendees

- Single: "with John"
- Multiple: "with John and Sarah"
- Teams: "with team Engineering"

#### Reminders

- "remind me 30 minutes before"
- "alert 1 hour before"
- "notify 1 day before"

## Advanced Features

### Plugin System

Extend parsing capabilities with custom plugins:

```javascript
const customPlugin = {
  patterns: {
    myPattern: /your-regex-here/i
  },
  parser: (text) => {
    // Your parsing logic
    return {
      // Your parsed data
    };
  }
};

parser.registerPlugin('custom', customPlugin);
```

### Logging System

Configure logging levels:

```javascript
process.env.LOG_LEVEL = 'debug'; // debug, info, warn, error
```

### Error Handling

The parser provides detailed error information:

```javascript
try {
  const result = parser.parse(text);
} catch (error) {
  console.error('Parsing failed:', error.message);
}
```

## Development

### Technology Stack

- Electron for desktop application
- SQLite3 for data storage
- Modern JavaScript (ES2022+)
- Plugin Architecture for extensibility

### Testing

Run tests:

```bash
npm test
```

Run specific test file:

```bash
npx jest tests/parser.test.js
```

### Contributing

1. Fork the repository
2. Create your feature branch
3. Write tests for new features
4. Submit a pull request

## License

ISC
