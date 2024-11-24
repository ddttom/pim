const NaturalLanguageParser = require('../src/services/parser/core');

describe('Plugin System', () => {
  let parser;

  beforeEach(() => {
    parser = new NaturalLanguageParser();
  });

  describe('Plugin Registration', () => {
    test('should register valid plugin', () => {
      const testPlugin = {
        parse: (text) => ({ test: true }),
      };

      expect(() => {
        parser.registerPlugin('test', testPlugin);
      }).not.toThrow();
    });

    test('should reject invalid plugin', () => {
      const invalidPlugin = {};
      
      expect(() => {
        parser.registerPlugin('invalid', invalidPlugin);
      }).toThrow('Invalid plugin: must have a parse method');
    });
  });

  describe('Plugin Parsing', () => {
    test('should include plugin results in parse output', () => {
      const locationPlugin = {
        parse: () => ({
          building: 'A',
          room: '123',
        }),
      };

      parser.registerPlugin('location', locationPlugin);
      const result = parser.parse('meeting in Building A Room 123');
      
      expect(result.plugins.location).toEqual({
        building: 'A',
        room: '123',
      });
    });

    test('should handle multiple plugins', () => {
      const customPlugin = {
        parse: () => ({ custom: true }),
      };

      parser.registerPlugin('custom', customPlugin);
      const result = parser.parse('meeting custom-test in Room 123');
      
      expect(result.plugins).toMatchObject({
        custom: { custom: true },
      });
    });

    test('should handle plugin errors gracefully', () => {
      const errorPlugin = {
        parse: () => {
          throw new Error('Plugin error');
        },
      };

      parser.registerPlugin('error', errorPlugin);
      const result = parser.parse('test text');
      
      expect(result.plugins).toEqual({});
    });
  });
}); 