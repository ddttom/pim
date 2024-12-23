import { name, parse } from '../../src/services/parser/parsers/location.js';

describe('Location Parser', () => {
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
    test('should detect explicit location markers', async () => {
      const result = await parse('Meeting at [location:Conference Room A]');
      expect(result).toEqual({
        type: 'location',
        value: {
          name: 'Conference Room A',
          type: 'room'
        },
        metadata: {
          pattern: 'explicit_location',
          confidence: 0.95,
          originalMatch: '[location:Conference Room A]'
        }
      });
    });

    test('should detect addresses', async () => {
      const result = await parse('Meet at 123 Main St, City, State 12345');
      expect(result).toEqual({
        type: 'location',
        value: {
          address: '123 Main St',
          city: 'City',
          state: 'State',
          zip: '12345',
          type: 'address'
        },
        metadata: {
          pattern: 'address',
          confidence: 0.9,
          originalMatch: '123 Main St, City, State 12345'
        }
      });
    });

    test('should detect location references', async () => {
      const result = await parse('Meeting @office');
      expect(result).toEqual({
        type: 'location',
        value: {
          reference: 'office',
          type: 'reference'
        },
        metadata: {
          pattern: 'location_reference',
          confidence: 0.85,
          originalMatch: '@office'
        }
      });
    });
  });

  describe('Confidence Scoring', () => {
    test('should have higher confidence for explicit locations', async () => {
      const result = await parse('[location:Office]');
      expect(result.metadata.confidence).toBeGreaterThan(0.8);
    });

    test('should have lower confidence for implicit locations', async () => {
      const result = await parse('at the office');
      expect(result.metadata.confidence).toBeLessThan(0.8);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid location format', async () => {
      const result = await parse('[location:]');
      expect(result).toBeNull();
    });

    test('should handle invalid address format', async () => {
      const result = await parse('123,,');
      expect(result).toBeNull();
    });
  });
});
