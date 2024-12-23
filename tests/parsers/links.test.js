                                                                      import { name, parse } from '../../src/services/parser/parsers/links.js';

describe('Links Parser', () => {
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
    test('should detect URLs', async () => {
      const result = await parse('Check https://example.com/page');
      expect(result).toEqual({
        type: 'link',
        value: {
          url: 'https://example.com/page',
          type: 'url'
        },
        metadata: {
          pattern: 'url',
          confidence: 0.95,
          originalMatch: 'https://example.com/page'
        }
      });
    });

    test('should detect markdown links', async () => {
      const result = await parse('See [documentation](https://docs.example.com)');
      expect(result).toEqual({
        type: 'link',
        value: {
          url: 'https://docs.example.com',
          text: 'documentation',
          type: 'markdown'
        },
        metadata: {
          pattern: 'markdown_link',
          confidence: 0.95,
          originalMatch: '[documentation](https://docs.example.com)'
        }
      });
    });

    test('should detect file links', async () => {
      const result = await parse('Open [file:documents/report.pdf]');
      expect(result).toEqual({
        type: 'link',
        value: {
          path: 'documents/report.pdf',
          type: 'file'
        },
        metadata: {
          pattern: 'file_link',
          confidence: 0.9,
          originalMatch: '[file:documents/report.pdf]'
        }
      });
    });
  });

  describe('Confidence Scoring', () => {
    test('should have higher confidence for explicit URLs', async () => {
      const result = await parse('https://example.com');
      expect(result.metadata.confidence).toBeGreaterThan(0.8);
    });

    test('should have lower confidence for implicit links', async () => {
      const result = await parse('example.com');
      expect(result.metadata.confidence).toBeLessThan(0.8);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid URLs', async () => {
      const result = await parse('https://');
      expect(result).toBeNull();
    });

    test('should handle invalid markdown links', async () => {
      const result = await parse('[broken](link');
      expect(result).toBeNull();
    });
  });
});
