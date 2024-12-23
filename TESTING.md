# Testing Standards

## Parser Test Structure

Each parser test file should follow this structure:

1. Input Validation Tests

```javascript
describe('Input Validation', () => {
    test('handles null input', async () => {
        const result = await parse(null);
        expect(result).toEqual({
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        });
    });

    test('handles empty string', async () => {
        const result = await parse('');
        expect(result).toEqual({
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        });
    });
});
```

2. Pattern Matching Tests

```javascript
describe('Pattern Matching', () => {
    test('detects explicit patterns', async () => {
        const result = await parse('[type:value]');
        expect(result).toEqual({
            type: 'parsertype',
            value: expect.any(Object),
            metadata: expect.any(Object)
        });
    });

    test('detects standard patterns', async () => {
        const result = await parse('standard pattern');
        expect(result.value).toBeDefined();
        expect(result.metadata.pattern).toBe('standard_pattern');
    });
});
```

3. Confidence Score Testing

```javascript
describe('Confidence Scoring', () => {
    test('should have higher confidence for explicit patterns', async () => {
        const result = await parse('[explicit:value]');
        expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9);
    });

    test('should have lower confidence for inferred patterns', async () => {
        const result = await parse('inferred value');
        expect(result.metadata.confidence).toBeLessThanOrEqual(0.8);
    });
});
```

4. Error Handling Tests

```javascript
describe('Error Handling', () => {
    test('handles invalid format', async () => {
        const result = await parse('[invalid:]');
        expect(result).toBeNull();
    });

    test('handles parser errors gracefully', async () => {
        const result = await parse('invalid \0 character');
        expect(result).toEqual({
            type: 'error',
            error: 'PARSER_ERROR',
            message: expect.any(String)
        });
    });
});
```

## Confidence Level Standards

1. Use inclusive operators:
   - Use `toBeGreaterThanOrEqual()` instead of `toBeGreaterThan()`
   - Use `toBeLessThanOrEqual()` instead of `toBeLessThan()`

2. Standard confidence levels:
   - Explicit patterns [type:X]: >= 0.95
   - Standard patterns (12h time): >= 0.90
   - Time-based patterns (ASAP): >= 0.85
   - Inferred patterns: <= 0.80
   - Invalid/uncertain: <= 0.70

3. Pattern-specific confidence examples:

   ```javascript
   // Status Parser
   '[status:done]'      -> 0.95  // explicit
   'marked as done'     -> 0.80  // state
   '50% complete'       -> 0.80  // progress

   // TimeOfDay Parser
   '[time:14:30]'       -> 0.95  // explicit
   '2:30 PM'           -> 0.90  // 12h format
   'in the afternoon'   -> 0.80  // natural

   // Urgency Parser
   '[urgency:high]'     -> 0.95  // explicit
   'ASAP'              -> 0.85  // time-based
   'urgent'            -> 0.80  // keyword
   ```

## Test File Organization

1. File Naming:
   - Match implementation file name
   - Append .test.js
   - Maintain case sensitivity
   - Example: timeOfDay.js → timeOfDay.test.js

2. Import Standards:

   ```javascript
   import { name, parse } from '../../src/services/parser/parsers/parserName.js';
   ```

3. Test Structure:
   - Group related tests with describe()
   - Use clear test descriptions
   - Test one behavior per test
   - Include positive and negative cases

4. Assertion Best Practices:
   - Use specific matchers
   - Check complete objects
   - Verify metadata
   - Validate confidence scores
