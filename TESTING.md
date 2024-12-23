# Testing Standards

## Confidence Score Testing

When testing parser confidence levels:

1. Use inclusive operators:
   - Use `toBeGreaterThanOrEqual()` instead of `toBeGreaterThan()`
   - Use `toBeLessThanOrEqual()` instead of `toBeLessThan()`

2. Follow confidence thresholds:
   - High confidence: >= 0.9
   - Medium confidence: >= 0.8
   - Low confidence: <= 0.8
   - Invalid/uncertain: <= 0.7

3. Example test structure:

```javascript
describe('Confidence Scoring', () => {
  test('should have higher confidence for explicit patterns', async () => {
    const result = await parse('[explicit:value]');
    expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9);
  });

  test('should have lower confidence for inferred patterns', async () => {
    const result = await parse('natural value');
    expect(result.metadata.confidence).toBeLessThanOrEqual(0.8);
  });
});
```
