import { name, parse } from '../../src/services/parser/parsers/categories.js';

describe('Categories Parser', () => {
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

  describe('Pattern Matching', () => {
    test('should detect explicit category markers', async () => {
      const result = await parse('Task [category:work]');
      expect(result).toEqual({
        type: 'category',
        value: {
          category: 'work',
          subcategories: []
        },
        metadata: {
          pattern: 'explicit_category',
          confidence: 0.9,
          originalMatch: '[category:work]'
        }
      });
    });

    test('should detect nested categories', async () => {
      const result = await parse('Task [category:work/meetings/team]');
      expect(result).toEqual({
        type: 'category',
        value: {
          category: 'work',
          subcategories: ['meetings', 'team']
        },
        metadata: {
          pattern: 'nested_category',
          confidence: 0.95,
          originalMatch: '[category:work/meetings/team]'
        }
      });
    });

    test('should detect multiple categories', async () => {
      const result = await parse('Task [category:work] [category:urgent]');
      expect(result).toEqual({
        type: 'category',
        value: {
          categories: ['work', 'urgent']
        },
        metadata: {
          pattern: 'multiple_categories',
          confidence: 0.9,
          originalMatch: '[category:work] [category:urgent]'
        }
      });
    });
  });

  describe('Confidence Scoring', () => {
    test('should have higher confidence for explicit categories', async () => {
      const result = await parse('[category:Project]');
      expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9);
    });

    test('should have lower confidence for inferred categories', async () => {
      const result = await parse('#project');
      expect(result.metadata.confidence).toBeLessThanOrEqual(0.8);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid category format', async () => {
      const result = await parse('[category:]');
      expect(result).toBeNull();
    });
  });
});
