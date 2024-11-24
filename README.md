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
- Time of day understanding (morning 9-12, afternoon 12-5, evening 5-9)
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
- "beginning of next month"

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

The parser uses a modular architecture:

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

## Parser Attributes

### Core Attributes

- `action` - The primary action (meet, call, text, review)
- `datetime` - The parsed date and time
- `rawContent` - Original input text

### Time-Related

- `timeOfDay` - Time specification
  - `period` (morning, afternoon, evening)
  - `start` and `end` hours
  - `hour` and `minute` for specific times
- `duration` - Length of event
  - `hours`
  - `minutes`

### People and Teams

- `contact` - Primary contact person
- `attendees`
  - `people` - Array of attendee names
  - `teams` - Array of team names
  - `type` (invite, etc.)

### Location

- `location`
  - `type` (office, online, travel)
  - `value` (location name)
  - `room` (optional)
  - `link` (for online meetings)

### Project Management attributes

- `project`
  - `project` (project name)
  - `contexts` (array of technical contexts like $frontend)
- `dependencies`
  - `after` (dependency condition)
  - `before` (prerequisite)
  - `followup`
    - `time`
    - `unit`

### Status and Progress

- `status`
  - `status` (current state)
  - `progress` (percentage)
  - `blocker` or `blockers` (array)
- `complexity`
  - `level` (high, medium, low)
- `urgency`
  - `level` (immediate, today, soon)
- `priority` (high, medium, low)

### Categories and Tags

- `categories` - Array of category names
- `subject`
  - `subject` (main topic)
  - `type` (afterContact, about, hashtag)
  - `tags` (array of hashtags)

### Reminders attributes

- `reminders`
  - `reminderMinutes` (single value or array)
  - `type` (custom, default)

### Recurring Patterns

- `recurring`
  - `type` (daily, weekly, monthly)
  - `interval` (for weekly patterns)

### Plugin Results

- `plugins` - Results from custom plugins

## Plugin System

The parser includes a powerful plugin system for extending its functionality. Each plugin can add custom parsing capabilities without modifying the core parser code.

### Writing Plugins

A plugin must include:

1. A `parse` method that accepts text input and returns parsed data
2. Optional patterns for text matching
3. Proper error handling
4. Documentation of input/output formats

Example plugin:

`
const myPlugin = {
  parse: (text) => {
    // Parse the text
    return {
      // Return parsed data
    };
  }
};
`

### Using Plugins

Register plugins with the parser:

`
const parser = new Parser();
parser.registerPlugin('myPlugin', myPlugin);
`

Access plugin results:

`
const result = parser.parse('your text here');
console.log(result.plugins.myPlugin);
`

### Plugin Best Practices

1. Single Responsibility
   - Focus on one specific parsing task
   - Keep plugins simple and focused

2. Error Handling
   - Return null for unmatched input
   - Handle edge cases gracefully
   - Don't throw errors unless necessary

3. Performance
   - Use efficient regex patterns
   - Avoid expensive operations
   - Cache results when appropriate

4. Documentation
   - Document expected input formats
   - Describe output structure
   - Include usage examples

5. Testing
   - Write comprehensive tests
   - Include edge cases
   - Test error conditions

For more information about plugin development, see the API documentation or contact the development team.
