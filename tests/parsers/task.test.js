import { name, parse } from '../../src/services/parser/parsers/task.js';

describe('Confidence Scoring', () => {
  test('should have higher confidence for explicit tasks', async () => {
    const result = await parse('[task:123]');
    expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9);
  });

  test('should have lower confidence for inferred tasks', async () => {
    const result = await parse('related to task 123');
    expect(result.metadata.confidence).toBeLessThanOrEqual(0.8);
  });
});
