import { name, parse } from '../../src/services/parser/parsers/team.js';

describe('Confidence Scoring', () => {
  test('should have higher confidence for explicit teams', async () => {
    const result = await parse('[team:frontend]');
    expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9);
  });

  test('should have lower confidence for inferred teams', async () => {
    const result = await parse('frontend team');
    expect(result.metadata.confidence).toBeLessThanOrEqual(0.8);
  });
});
