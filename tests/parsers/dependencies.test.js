import { name, parse } from '../../src/services/parser/parsers/dependencies.js';

describe('Dependencies Parser', () => {
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
    test('should detect explicit dependencies', async () => {
      const result = await parse('Task depends on [task:123]');
      expect(result).toEqual({
        type: 'dependency',
        value: {
          type: 'task',
          id: '123',
          relationship: 'depends_on'
        },
        metadata: {
          pattern: 'explicit_dependency',
          confidence: 0.95,
          originalMatch: 'depends on [task:123]'
        }
      });
    });

    test('should detect multiple dependencies', async () => {
      const result = await parse('After [task:123] and [task:456]');
      expect(result).toEqual({
        type: 'dependency',
        value: {
          dependencies: [
            { type: 'task', id: '123', relationship: 'after' },
            { type: 'task', id: '456', relationship: 'after' }
          ]
        },
        metadata: {
          pattern: 'multiple_dependencies',
          confidence: 0.9,
          originalMatch: 'After [task:123] and [task:456]'
        }
      });
    });

    test('should detect dependency relationships', async () => {
      const result = await parse('Blocks [task:789]');
      expect(result).toEqual({
        type: 'dependency',
        value: {
          type: 'task',
          id: '789',
          relationship: 'blocks'
        },
        metadata: {
          pattern: 'relationship_dependency',
          confidence: 0.9,
          originalMatch: 'Blocks [task:789]'
        }
      });
    });
  });

  describe('Confidence Scoring', () => {
    test('should have higher confidence for explicit dependencies', async () => {
      const result = await parse('[task:123] depends on [task:456]');
      expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9);
    });

    test('should have lower confidence for implicit dependencies', async () => {
      const result = await parse('after task abc');
      expect(result.metadata.confidence).toBeLessThanOrEqual(0.8);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid task references', async () => {
      const result = await parse('[task:]');
      expect(result).toBeNull();
    });

    test('should handle invalid dependency format', async () => {
      const result = await parse('depends on task');
      expect(result).toBeNull();
    });
  });
});
