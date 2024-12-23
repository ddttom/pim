import { name, parse } from '../../src/services/parser/parsers/cost.js';

describe('Cost Parser', () => {
  describe('Input Validation', () => {
    test('should handle null input', async () => {
      const result = await parse(null);
      expect(result).toEqual({
        type: 'error',
        error: 'INVALID_INPUT',
        message: 'Input must be a non-empty string'
      });
    });

    test('should handle empty string', async () => {
      const result = await parse('');
      expect(result).toEqual({
        type: 'error',
        error: 'INVALID_INPUT',
        message: 'Input must be a non-empty string'
      });
    });
  });

  describe('Confidence Scoring', () => {
    test('should have higher confidence for explicit costs', async () => {
      const result = await parse('[cost:$500]');
      expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9);
    });

    test('should have lower confidence for inferred costs', async () => {
      const result = await parse('costs $500');
      expect(result.metadata.confidence).toBeLessThanOrEqual(0.8);
    });
  });
}); 
