import { name, parse } from '../../src/services/parser/parsers/progress.js';

describe('Progress Parser', () => {
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

    test('returns null for text without progress', async () => {
      const result = await parse('Regular text without progress');
      expect(result).toBeNull();
    });
  });

  describe('Pattern Matching', () => {
    test('should detect explicit progress markers', async () => {
      const result = await parse('[progress:75%]');
      expect(result).toEqual({
        type: 'progress',
        value: {
          percentage: 75
        },
        metadata: {
          pattern: 'explicit',
          confidence: 0.95,
          originalMatch: '[progress:75%]'
        }
      });
    });

    test('should detect inferred progress', async () => {
      const result = await parse('Task is 50% complete');
      expect(result).toEqual({
        type: 'progress',
        value: {
          percentage: 50
        },
        metadata: {
          pattern: 'inferred',
          confidence: 0.8,
          originalMatch: '50% complete'
        }
      });
    });

    test('should handle various completion terms', async () => {
      const terms = ['complete', 'done', 'finished'];
