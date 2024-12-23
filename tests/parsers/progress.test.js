import { name, parse } from '../../src/services/parser/parsers/progress.js';

describe('Confidence Scoring', () => {
  test('should have higher confidence for explicit progress', async () => {
    const result = await parse('[progress:75%]');
    expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9);
  });

  test('should have lower confidence for inferred progress', async () => {
    const result = await parse('75% complete');
    expect(result.metadata.confidence).toBeLessThanOrEqual(0.8);
  });
});
