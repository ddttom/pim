import { name, parse } from '../../src/services/parser/parsers/role.js';

describe('Confidence Scoring', () => {
  test('should have higher confidence for explicit roles', async () => {
    const result = await parse('[role:developer]');
    expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9);
  });

  test('should have lower confidence for inferred roles', async () => {
    const result = await parse('as developer');
    expect(result.metadata.confidence).toBeLessThanOrEqual(0.8);
  });
});
