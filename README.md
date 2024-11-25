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

- `action` - Primary action (call, text, meet, email, review, see → meet, contact → call)
- `datetime` - Scheduled date and time
- `dueDate` - Deadline (when using "by", "before", "due")
- `final_deadline` - Latest of datetime and dueDate
- `rawContent` - Original input text

### Time-Related

- `timeOfDay`
  - `hour` - Specific hour (24h format)
  - `minutes` - Specific minutes
  - `period` - Time period (morning 9-12, afternoon 12-17, evening 17-21)
  - `start` and `end` - Period boundaries
- `duration`
  - `hours`
  - `minutes`

### People and Teams

- `contact` - Primary contact (from "call [name]", "text [name]", "with [name]")
- `attendees`
  - `people` - Array of attendee names
  - `teams` - Array of team names

### Location

- `location`
  - `type` - office, online, travel
  - `value` - Location name/description
  - `link` - For online meetings (zoom links etc.)

### Project Management 2

- `project`
  - `project` - Project name (from "project [name]")
  - `contexts` - Technical contexts (from $tags)
- `dependencies`
  - `after` - Tasks that must complete first
  - `before` - Prerequisites
  - `blockedBy` - Current blockers

### Status and Progress

- `status`
  - `progress` - Percentage complete
  - `state` - Current state
- `complexity`
  - `level` - high, medium, low
- `urgency`
  - `level` - immediate, today, soon
- `priority` - high, medium, low

### Categories and Tags

- `categories` - Automatically assigned categories
- `subject`
  - `subject` - Main topic
  - `type` - hashtag, afterContact, about
  - `tags` - Array of #hashtags

### Reminders 2

- `reminders`
  - `reminderMinutes` - Minutes before event
  - `type` - custom, default

### Recurring Patterns

- `recurring`
  - `type` - daily, weekly, monthly
  - `interval` - For weekly patterns (monday, tuesday, etc.)

### Plugin Results

- `plugins` - Results from custom plugins

## Natural Language Examples 2

### Basic Tasks 2

- "Call John tomorrow at 2pm" → {action: "call", contact: "john", datetime: "2024-01-25T14:00:00"}
- "Text Sarah about meeting" → {action: "text", contact: "sarah", subject: {subject: "meeting"}}
- "See Simon about Project Alpha" → {action: "meet", contact: "simon", project: {project: "Alpha"}}
- "Contact Ian about project" → {action: "call", contact: "ian"}

### Date Examples

- "Call John by next Wednesday" →

  ```json
  {
    "action": "call",
    "contact": "john",
    "datetime": "2024-12-04T00:00:00Z",
    "dueDate": "2024-12-04T00:00:00Z",
    "final_deadline": "2024-12-04T00:00:00Z"
  }
  ```

### Action Normalization

The parser normalizes various action verbs:

- "see" → "meet"
- "contact" → "call"
- "review" → "review"
- "text" → "text"
- "email" → "email"

### Date Display

Dates are displayed in user's locale with:

- Short weekday (Mon, Tue, etc.)
- Short month
- Day and year
- 12-hour time with AM/PM

Example: "Mon, Jan 15, 2024, 02:30 PM"

### Date Handling

- When dates are identical (datetime = dueDate = final_deadline), only final_deadline is shown
- When dates differ, all relevant dates are displayed
- Timeline view sorts by final_deadline, falling back to dueDate then datetime

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
