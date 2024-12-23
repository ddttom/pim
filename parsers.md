# Parser Documentation

## Overview

The parsing system consists of multiple specialized parsers that extract structured information from text input. Each parser follows a standardized pattern for consistency and reliability.

## Common Features

- Async/await support
- Standardized error handling via error objects
- Confidence scoring (0.95-0.75)
- Metadata enrichment
- Input validation
- Pattern-based matching
- Best match selection

## Confidence Scoring Guidelines

Parsers use a standardized confidence scoring system:

| Confidence Level | Score Range | Usage |
|-----------------|-------------|--------|
| High | >= 0.90 | Explicit patterns, exact matches |
| Medium | >= 0.80 | Standard patterns, clear context |
| Low | <= 0.80 | Implicit patterns, inferred context |
| Invalid | <= 0.70 | Uncertain or weak matches |

### Testing Confidence Scores

When testing parser confidence levels:

- Use `>=` instead of `>` for minimum thresholds
- Use `<=` instead of `<` for maximum thresholds
- Example: `expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9)`

## Error Handling

All parsers should return a standard error object for invalid input:

```javascript
{
    type: 'error',
    error: 'INVALID_INPUT',
    message: 'Input must be a non-empty string'
}
```

## Base Parser Template

All parsers should extend this base template (base.js):

```javascript
/**
 * Base Parser Template
 * 
 * This template implements the standard parser structure that all parsers should follow.
 * Key features:
 * - Standardized error handling via exceptions
 * - Consistent confidence scoring (0.0-1.0)
 * - Pattern-based matching with priority
 * - Rich metadata generation
 * - Best match selection
 */

import { createLogger } from '../../../utils/logger.js';

// Initialize logger at module level
const logger = createLogger('ParserName');

// Export parser name
export const name = 'parsername';

/**
 * Main parse function
 * @param {string} text - Input text to parse
 * @returns {Object|Array|null} Parsed result(s) or null if no match
 * @throws {Error} If input is invalid
 */
export async function parse(text) {
    // Input validation
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    // Define patterns in order of confidence
    const patterns = {
        explicit_pattern: /\[type:([^\]]+)\]/i,     // Highest confidence (0.95)
        standard_pattern: /\b(pattern)\b/i,         // Standard confidence (0.90)
        implicit_pattern: /(.+)/i                   // Lowest confidence (0.80)
    };

    // For single-match parsers
    let bestMatch = null;
    let highestConfidence = 0;

    // For multi-match parsers
    const results = [];

    // Pattern matching
    for (const [pattern, regex] of Object.entries(patterns)) {
        const match = text.match(regex);
        if (match) {
            let confidence;
            let value;

            // Pattern-specific processing
            switch (pattern) {
                case 'explicit_pattern': {
                    confidence = 0.95;
                    value = {
                        // Parser-specific value structure
                        field: match[1].trim()
                    };
                    break;
                }
                case 'standard_pattern': {
                    confidence = 0.90;
                    value = {
                        field: match[1].trim()
                    };
                    break;
                }
                case 'implicit_pattern': {
                    confidence = 0.80;
                    value = {
                        field: match[1].trim()
                    };
                    break;
                }
            }

            // For single-match parsers: track best match
            if (confidence > highestConfidence) {
                highestConfidence = confidence;
                bestMatch = {
                    type: name,
                    value,
                    metadata: {
                        confidence,
                        pattern,
                        originalMatch: match[0]
                    }
                };
            }

            // For multi-match parsers: collect all matches
            results.push({
                type: name,
                value,
                metadata: {
                    confidence,
                    pattern,
                    originalMatch: match[0]
                }
            });
        }
    }

    // Return based on parser type
    // Single match: return bestMatch
    return bestMatch;
    // Multiple matches: return results.length > 0 ? results : null;
}
```

## Implemented Parsers

Each parser follows the base template with specific patterns and confidence levels:

### Core Parsers

1. Status Parser
   - `[status:X]` - 0.95 confidence
   - `marked as X` - 0.80 confidence
   - `X% complete` - 0.80 confidence

2. Subject Parser
   - Text cleanup (time, date, project refs)
   - Key term extraction
   - Action verb detection

3. Tags Parser
   - `[tag:X]` - 0.95 confidence
   - `#tag` - 0.80 confidence
   - Multiple tag support

4. Task Parser
   - `[task:123]` - 0.95 confidence
   - `task 123` - 0.80 confidence
   - Task ID validation

5. Team Parser
   - `[team:X]` - 0.95 confidence
   - `X team` - 0.80 confidence
   - Predefined team validation

6. TimeOfDay Parser
   - `[time:14:30]` - 0.95 confidence
   - `2:30 PM` - 0.90 confidence
   - `afternoon` - 0.80 confidence

7. Urgency Parser
   - `[urgency:X]` - 0.95 confidence
   - `ASAP` - 0.85 confidence
   - `urgent` - 0.80 confidence

8. Version Parser
   - `[version:1.0.0]` - 0.95 confidence
   - `version 1.0.0` - 0.80 confidence
   - Semantic version validation

### Additional Parsers (Ready for Testing)

- Action Parser (verbs, completion)
- Attendees Parser (lists, roles)
- Categories Parser (hierarchical)
- Complexity Parser (levels, scoring)
- Contact Parser (email, phone)
- Contexts Parser (location, time)
- Dependencies Parser (tasks)
- Duration Parser (explicit, natural)
- Links Parser (URLs, files)
- Location Parser (rooms, addresses)
- Participants Parser (lists, roles)

## Return Format

### Single Match Success

```javascript
{
    type: 'parsertype',
    value: {
        // Parser-specific structure
    },
    metadata: {
        confidence: Number,
        pattern: String,
        originalMatch: String
    }
}
```

### Multiple Matches Success

```javascript
[
    {
        type: 'parsertype',
        value: {
            // Parser-specific structure
        },
        metadata: {
            confidence: Number,
            pattern: String,
            originalMatch: String
        }
    }
]
```

### No Match

```javascript
null
```

### Error Handling 2

```javascript
throw new Error('Invalid input: text must be a non-empty string');
```

## Test Standards

Each parser must have comprehensive tests:

```javascript
describe('Parser Name', () => {
    describe('Input Validation', () => {
        test('should handle null input', async () => {
            await expect(parse(null)).rejects.toThrow('Invalid input');
        });
    });

    describe('Pattern Matching', () => {
        test('should detect explicit patterns', async () => {
            const result = await parse('[type:value]');
            expect(result).toEqual({
                type: 'parsertype',
                value: expect.any(Object),
                metadata: expect.any(Object)
            });
        });
    });

    describe('Confidence Scoring', () => {
        test('should have higher confidence for explicit patterns', async () => {
            const result = await parse('[explicit:value]');
            expect(result.metadata.confidence).toBeGreaterThan(0.9);
        });
    });
});
```

## Usage Example

```javascript
import { parse } from './parsers/tags.js';

const text = 'Task with #tag and [category:value]';
const result = await parse(text);

if (result) {
    console.log('Type:', result.type);
    console.log('Value:', result.value);
    console.log('Confidence:', result.metadata.confidence);
}
```
