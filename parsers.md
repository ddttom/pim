# Text Parsers Documentation

## Overview

The parser system breaks down natural language text input into structured data using specialized parsers. Each parser is responsible for extracting specific types of information and follows a standardized pattern.

## Parser Directory Structure

    src/services/parser/
    ├── parsers/
    │   ├── attendees.js
    │   ├── categories.js
    │   ├── complexity.js
    │   ├── contact.js
    │   ├── date.js
    │   ├── dependencies.js
    │   ├── duration.js
    │   ├── links.js
    │   ├── location.js
    │   ├── priority.js
    │   ├── project.js
    │   ├── recurring.js
    │   ├── reminders.js
    │   ├── status.js
    │   ├── subject.js
    │   └── urgency.js
    └── utils/
        └── patterns.js

## Standard Parser Template

All parsers must follow the standardized template (base.js) to ensure consistency and maintainability:

```javascript
import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch } from '../utils/patterns.js';

const logger = createLogger('ParserName');

// Define patterns at module level for performance
const PATTERNS = {
    // Primary patterns
    main: /your-main-pattern-here/i,
    alternative: /alternative-pattern/i,
    
    // Support patterns
    auxiliary: /support-pattern/i
};

export default {
    name: 'parser_name',
    
    parse(text) {
        // Input validation
        if (!text || typeof text !== 'string') {
            logger.warn('Invalid input:', { text });
            return {
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            };
        }

        try {
            // Check each pattern in order of preference
            for (const [patternName, pattern] of Object.entries(PATTERNS)) {
                const match = text.match(pattern);
                
                if (validatePatternMatch(match)) {
                    const value = this.extractValue(match);
                    const confidence = this.calculateConfidence(match[0], text);
                    
                    logger.debug('Pattern match found:', {
                        pattern: patternName,
                        match: match[0],
                        value,
                        confidence
                    });

                    return {
                        type: this.name,
                        value,
                        metadata: {
                            pattern: patternName,
                            confidence,
                            originalMatch: match[0]
                        }
                    };
                }
            }

            logger.debug('No pattern matches found');
            return null;

        } catch (error) {
            logger.error('Parser error:', {
                error: error.message,
                stack: error.stack,
                input: text
            });
            
            return {
                type: 'error',
                error: 'PARSER_ERROR',
                message: error.message
            };
        }
    },

    extractValue(match) {
        // Extract and transform the matched value
        return match[1]?.trim();
    },

    calculateConfidence(match, fullText) {
        let confidence = 0.5; // Base confidence
        
        // Common confidence factors:
        // - Pattern specificity
        // - Match position
        // - Supporting context
        // - Quality indicators
        
        return Math.min(1, confidence);
    }
};
```

### Key Components

1. **Pattern Management**
   - Patterns defined at module level for performance
   - Organized by primary and support patterns
   - Pattern prioritization through ordering

2. **Error Handling**
   - Structured error objects with type and message
   - Input validation at entry point
   - Detailed error logging with context
   - Graceful handling of edge cases

3. **Metadata Generation**
   - Pattern identification
   - Confidence scoring
   - Original match preservation
   - Pattern-specific information

4. **Required Methods**
   - parse(text): Main entry point with validation
   - extractValue(match): Transform matched content
   - calculateConfidence(match, fullText): Score quality

5. **Logging**
   - Consistent logger naming
   - Debug logs for pattern matches
   - Warning logs for invalid input
   - Error logs with stack traces

## Available Parsers

### 1. Project Parser

Extracts project names and references.

Example:
    // Input: "Meeting about Project Alpha"
    // Output: { type: 'project', value: 'Project Alpha' }

    const patterns = {
        project: /\bProject\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*)/,
        about: /\babout\s+Project\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*)/,
        re: /\bre\s+Project\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*)/
    };

### 2. Contact Parser

Identifies people mentioned in the text.

Example:
    // Input: "Call John about meeting"
    // Output: { type: 'contact', value: 'John' }

    const patterns = {
        action: /\b(?:call|email|message|contact|meet)\s+([A-Z][a-z]+)(?:\s|$)/,
        with: /\bwith\s+([A-Z][a-z]+)(?:\s|$)/
    };

### 3. Location Parser

Extracts meeting or event locations.

Example:
    // Input: "Meeting at Coffee Shop"
    // Output: { type: 'location', value: 'Coffee Shop' }

    const patterns = {
        at: /\bat\s+([A-Za-z][a-zA-Z0-9\s]+(?:\s+[A-Za-z][a-zA-Z0-9\s]*)*)/i,
        in: /\bin\s+([A-Za-z][a-zA-Z0-9\s]+(?:\s+[A-Za-z][a-zA-Z0-9\s]*)*)/i,
        location: /location:\s+([A-Za-z][a-zA-Z0-9\s]+(?:\s+[A-Za-z][a-zA-Z0-9\s]*)*)/i
    };

### 4. Duration Parser

Parses time durations.

Example:
    // Input: "Meeting for 2 hours"
    // Output: { type: 'duration', value: 120 }

    const DURATION_PATTERNS = [
        { regex: /(\d+)\s*(?:hour|hr)s?/i, multiplier: 60 },
        { regex: /(\d+)\s*(?:minute|min)s?/i, multiplier: 1 },
        { regex: /(\d+)\s*(?:day)s?/i, multiplier: 1440 }
    ];

### 5. Status Parser

Identifies task/project status.

Example:
    // Input: "Project started yesterday"
    // Output: { type: 'status', value: 'Started' }

    const STATUS_KEYWORDS = {
        'started': 'Started',
        'in progress': 'InProgress',
        'done': 'Done',
        'completed': 'Completed',
        'pending': 'Pending',
        'blocked': 'Blocked'
    };

### 6. Priority Parser

Determines task priority levels.

Example:
    // Input: "Urgent meeting tomorrow"
    // Output: { type: 'priority', value: 'high' }

    const PRIORITY_LEVELS = {
        'urgent': 'high',
        'high': 'high',
        'medium': 'medium',
        'normal': 'normal',
        'low': 'low'
    };

### 7. Complexity Parser

Assesses task complexity.

Example:
    // Input: "Complex task review needed"
    // Output: { type: 'complexity', value: 3 }

    const COMPLEXITY_LEVELS = {
        'simple': 1,
        'easy': 1,
        'medium': 2,
        'moderate': 2,
        'complex': 3,
        'difficult': 3,
        'hard': 3
    };

### 8. Categories Parser

Extracts hashtags and categories.

Example:
    // Input: "Meeting #important #project"
    // Output: { type: 'categories', value: ['important', 'project'] }

    const hashtagPattern = /#([a-zA-Z]\w+)/g;

### 9. Dependencies Parser

Identifies task dependencies.

Example:
    // Input: "Must be done after Project Alpha"
    // Output: { type: 'dependencies', value: 'Project Alpha' }

    const dependencyPattern = /\b(?:after|depends on|requires|needs?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;

### 10. Date Parser

Parses date references.

Example:
    // Input: "Meeting tomorrow"
    // Output: { type: 'date', value: '2024-01-22T09:00:00.000Z' }

    const DATE_PATTERNS = [
        {
            regex: /\b(tomorrow)\b/i,
            handler: () => {
                const date = new Date();
                date.setDate(date.getDate() + 1);
                return date;
            }
        },
        {
            regex: /\bnext\s+(week|month)\b/i,
            handler: (match) => {
                const date = new Date();
                if (match[1].toLowerCase() === 'week') {
                    date.setDate(date.getDate() + 7);
                } else {
                    date.setMonth(date.getMonth() + 1);
                }
                return date;
            }
        }
    ];

### 11. Recurring Parser

Identifies recurring patterns.

Example:
    // Input: "Meeting every week"
    // Output: { type: 'recurring', value: { frequency: 'weekly' } }

    const RECURRING_PATTERNS = {
        'daily': /\bevery\s+day\b/i,
        'weekly': /\bevery\s+week\b/i,
        'monthly': /\bevery\s+month\b/i,
        'weekday': /\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
    };

### 12. Subject Parser

Extracts the main subject/topic.

Example:
    // Input: "Review project documentation"
    // Output: { type: 'subject', value: 'Review project documentation' }

    const IGNORE_PATTERNS = [
        /\b(?:at|in|on|with|for|to|from)\s+/i,
        /\b(?:every|each)\s+/i,
        /\b(?:high|medium|low)\s+priority\b/i,
        /\b(?:urgent|asap)\b/i,
        /#\w+/,
        /@\w+/
    ];

### 13. Reminders Parser

Extracts reminder information.

Example:
    // Input: "Remind me in 2 hours"
    // Output: { type: 'reminders', value: { time: '2024-01-21T14:00:00.000Z' } }

    const REMINDER_PATTERNS = [
        /\bremind\s+(?:me\s+)?(?:in|after)\s+(\d+)\s*(hour|minute|day)s?\b/i,
        /\bremind\s+(?:me\s+)?(?:at|on)\s+(\d{1,2}):(\d{2})\b/i
    ];

## Usage Examples

Complex Example:
    const text = "Call John about Project Alpha tomorrow at Coffee Shop #urgent";

    const parsers = [
        projectParser,
        contactParser,
        locationParser,
        dateParser,
        categoriesParser
    ];

    const results = parsers.map(parser => parser.parse(text))
                          .filter(result => result !== null);

    // Results:
    // [
    //     { type: 'contact', value: 'John' },
    //     { type: 'project', value: 'Project Alpha' },
    //     { type: 'location', value: 'Coffee Shop' },
    //     { type: 'date', value: '2024-01-22T09:00:00.000Z' },
    //     { type: 'categories', value: ['urgent'] }
    // ]

## Error Handling

All parsers implement standardized error handling:

- Errors are logged with stack traces
- Failed parsers return null
- Invalid matches return null
- Consistent error message format

## Best Practices

1. Always check for null returns
2. Use type-safe handling of parser results
3. Consider parser order for dependent information
4. Handle partial matches appropriately
5. Validate parser results before use
6. Keep patterns in constants at the top of files
7. Use consistent naming conventions
8. Maintain standardized return format

## Integration

Parsers can be used:

- Individually for specific data extraction
- As part of the larger parsing system
- In combination for complex text analysis
- With custom pattern matching

## Testing

Each parser should be tested with:

- Valid inputs
- Edge cases
- Invalid inputs
- Empty inputs
- Special characters
- Multiple matches
- Overlapping patterns

## Performance Considerations

1. Regex patterns are compiled once at module level
2. Early returns for no matches
3. Efficient string operations
4. Minimal object creation
5. Optimized pattern matching
