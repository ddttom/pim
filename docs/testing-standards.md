# Parser Testing Standards

## Confidence Testing Guidelines

1. Always use inclusive operators for confidence comparisons
2. Follow standardized confidence thresholds
3. Include both high and low confidence tests
4. Use descriptive test names
5. Follow the standard test structure

## Example Implementation

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

## Confidence Thresholds

- High confidence (explicit patterns): >= 0.9
- Medium confidence (standard patterns): >= 0.8
- Low confidence (inferred patterns): <= 0.8
- Invalid/uncertain matches: <= 0.7
