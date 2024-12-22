# Parser Documentation

## Overview

The parsing system consists of multiple specialized parsers that extract structured information from text input. Each parser follows a standardized pattern for consistency and reliability.

## Common Features

- Async/await support
- Standardized error handling
- Confidence scoring
- Metadata enrichment
- Input validation

## Parser Types

### Date Parser

Extracts date information in various formats:

- ISO format (2024-01-15)
- Natural language (January 15th, 2024)
- Relative dates (tomorrow, next week)

### Time Parser

Extracts time information:

- 12/24 hour format
- Natural language (morning, afternoon)
- Relative times (in 2 hours)

### Project Parser

Identifies project references:

- Explicit declarations (project: name)
- References (for project name)
- Shorthand ($project)

### Status Parser

Detects task status:

- Explicit status declarations
- Progress indicators
- State references
- Contextual status

### Tags Parser

Extracts and categorizes tags:

- Hashtags (#tag)
- Categories (+category)
- Topics (@topic)
- Inline tags [tag]

### Subject Parser

Processes main task subject:

- Removes metadata
- Extracts key terms
- Validates structure
- Identifies action verbs

### Recurring Parser

Identifies recurring patterns:

- Time intervals
- Day patterns
- End conditions

### Reminders Parser

Extracts reminder information:

- Time-based reminders
- Date-based reminders
- Relative reminders

### Priority Parser

Detects priority levels:

- Explicit priority
- Shorthand notation
- Contextual priority

## Parser Standards

### Parser Structure

Each parser must follow these standards:

1. File Organization:

```javascript
// Imports
import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

// Constants
const logger = createLogger('ParserName');
const PATTERNS = { /* ... */ };

// Exports
export const name = 'parsername';
export async function parse(text) { /* ... */ }

// Helper Functions
async function extractValue() { /* ... */ }
function calculateConfidence() { /* ... */ }
```

2. Required Exports:

- `name`: String identifier for the parser
- `parse`: Async function that processes input text

3. Error Handling:

```javascript
try {
    // Parser logic
} catch (error) {
    logger.error('Error in parser:', error);
    return {
        type: 'error',
        error: 'PARSER_ERROR',
        message: error.message
    };
}
```

### Return Format

1. Success Response:

```javascript
{
    type: 'parsertype',
    value: {
        // Parser-specific value structure
    },
    metadata: {
        pattern: 'matched_pattern',
        confidence: 0.0-1.0,
        originalMatch: 'matched_text',
        // Parser-specific metadata
    }
}
```

2. Error Response:

```javascript
{
    type: 'error',
    error: 'ERROR_CODE',
    message: 'Human readable message'
}
```

3. No Match:

```javascript
null
```

### Test Standards

1. Test File Structure:

```javascript
import { name, parse } from '../../src/services/parser/parsers/parser.js';

describe('Parser Name', () => {
    describe('Input Validation', () => {
        // Input validation tests
    });

    describe('Pattern Matching', () => {
        // Pattern-specific tests
    });

    describe('Confidence Scoring', () => {
        // Confidence calculation tests
    });

    describe('Error Handling', () => {
        // Error case tests
    });
});
```

2. Required Test Categories:

- Input validation
- Pattern matching
- Edge cases
- Error handling
- Confidence scoring
- Metadata validation

3. Test Case Standards:

```javascript
test('descriptive test name', async () => {
    const result = await parse('test input');
    expect(result).toEqual({
        type: 'expected_type',
        value: expect.any(Object),
        metadata: {
            pattern: expect.any(String),
            confidence: expect.any(Number),
            // ...other expectations
        }
    });
});
```

### Confidence Scoring

1. Base Confidence:

- Start with 0.7 base confidence
- Add/subtract based on specific criteria
- Cap at 1.0 maximum

2. Common Factors:

```javascript
function calculateConfidence(matches, text, type) {
    let confidence = 0.7;

    // Pattern-based confidence
    switch (type) {
        case 'explicit': confidence += 0.2; break;
        case 'implicit': confidence += 0.1; break;
        // ...
    }

    // Position-based confidence
    if (matches.index === 0) confidence += 0.1;
    if (text[matches.index - 1] === ' ') confidence += 0.05;

    return Math.min(confidence, 1.0);
}
```

### Pattern Matching

1. Pattern Organization:

```javascript
const PATTERNS = {
    explicit: /\b(?:pattern):\s*(value)\b/i,
    implicit: /\b(value)\b/i,
    // ...
};
```

2. Pattern Priorities:

- Explicit patterns (highest confidence)
- Structured patterns
- Contextual patterns
- Implicit patterns (lowest confidence)

### Error Codes

Standard error codes across all parsers:

- `INVALID_INPUT`: Input validation failures
- `PARSER_ERROR`: Internal parser errors
- `VALIDATION_ERROR`: Pattern validation failures
- `FORMAT_ERROR`: Format-specific errors

## Usage

```javascript
import { parsers, parseAll } from './services/parser';

// Parse specific type
const dateResult = await parsers.date(text);

// Parse all types
const { results, errors } = await parseAll(text);
```
