# Personal Information Manager (PIM)

A modern desktop application for managing personal information, tasks, and notes with advanced natural language processing capabilities.

## Features

### Core Features

- Natural language input processing
- Multiple view options (Table, Cards, Timeline)
- Priority system (high, medium, low)
- Category tagging
- Smart date/time parsing
- Advanced filtering capabilities

### Advanced Parsing Features

- Complex date handling (relative dates, weekends, last/first of month)
- Time of day understanding (morning, afternoon, evening)
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

### Natural Language Examples

#### Basic Tasks

- "Call John tomorrow at 2pm"
- "Email Sarah about the report by Friday"
- "Review code pull request #123"
- "Text Mike about lunch meeting"

#### Date and Time

- "Meeting next Wednesday at 10am"
- "Call on the last Friday of the month"
- "Team sync every Monday morning"
- "Project review next weekend"

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

### Smart Date Understanding

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

#### Special Date Handling

- "the weekend" (upcoming Saturday)
- "next weekend" (Saturday of next week)
- "last Friday of the month"
- "first Monday of next month"

### Time Expressions

#### Time of Day

- "morning" (9am-12pm)
- "afternoon" (12pm-5pm)
- "evening" (5pm-9pm)
- Specific times: "2:30pm", "14:30"

#### Duration

- "for 30 minutes"
- "lasting 2 hours"
- "1 hour long"

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
- Multiple: "alert me 1 hour before and 10 minutes before"

### Dependencies and Follow-ups

- "after deployment is complete"
- "blocked by QA testing"
- "follow up in 2 weeks"
- "check back when testing is done"

### Status Updates

- "75% complete"
- "blocked by deployment"
- "waiting for review"
- "in progress"

## Development

### Architecture

The parser is built with a modular architecture:

- Core Parser: Orchestrates parsing operations
- Individual Parsers: Handle specific aspects (date, time, location, etc.)
- Utilities: Shared functionality (validation, patterns, etc.)
- Plugin System: Extensible parsing capabilities

### Testing

Run all tests:

```bash
npm test
```

Run parser tests:

```bash
npm run test:parser
```

Run specific test file:

```bash
npx jest tests/parser.test.js
```

### Logging

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

### Plugin Development

Create custom plugins to extend functionality:

```javascript
const customPlugin = {
  patterns: {
    myPattern: /your-regex-here/i
  },
  parse: (text) => {
    // Your parsing logic
    return {
      // Your parsed data
    };
  }
};

parser.registerPlugin('custom', customPlugin);
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Write tests for new features
4. Submit a pull request

## License

ISC License (ISC)

Copyright (c) 2024 Tom Cranstoun

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

### License Summary

The ISC License:

- Permits commercial use
- Permits modification
- Permits distribution
- Permits private use
- Includes warranty protection for the author
- Includes liability protection for the author

For more information about the ISC License, visit: <https://opensource.org/licenses/ISC>
