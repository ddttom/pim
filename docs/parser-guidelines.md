# Parser Implementation Guidelines

## Confidence Scoring

1. Base confidence levels:
   - Explicit patterns: 0.95
   - Standard patterns: 0.90
   - Natural language: 0.80
   - Inferred patterns: 0.75

2. Testing confidence:
   ```javascript
   expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9); // High confidence
   expect(result.metadata.confidence).toBeLessThanOrEqual(0.8); // Low confidence
   ```

3. Confidence adjustments:
   - Position bonus: +0.05
   - Context bonus: +0.05
   - Multiple indicators: +0.05
   - Weak indicators: -0.05 
