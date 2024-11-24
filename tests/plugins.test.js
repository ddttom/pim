const parser = require('../src/services/parser');
const pluginManager = require('../src/plugins/pluginManager');

describe('Plugin System', () => {
  describe('Plugin Registration', () => {
    test('should register valid plugin', () => {
      const testPlugin = {
        patterns: {
          test: /test-pattern/i,
        },
        parser: (text) => ({ test: true }),
      };

      expect(() => {
        parser.registerPlugin('test', testPlugin);
      }).not.toThrow();
    });

    test('should reject invalid plugin', () => {
      const invalidPlugin = {
        patterns: {},
        // Missing parser function
      };

      expect(() => {
        parser.registerPlugin('invalid', invalidPlugin);
      }).toThrow();
    });
  });

  describe('Plugin Parsing', () => {
    test('should include plugin results in parse output', () => {
      const result = parser.parse('meeting in Building A Room 123');
      expect(result.plugins.location).toEqual({
        building: 'A',
        room: '123',
      });
    });

    test('should handle multiple plugins', () => {
      const customPlugin = {
        patterns: {
          custom: /custom-(?<value>\w+)/i,
        },
        parser: (text) => {
          const match = text.match(/custom-(?<value>\w+)/i);
          return match?.groups ? { value: match.groups.value } : null;
        },
      };

      parser.registerPlugin('custom', customPlugin);
      const result = parser.parse('meeting custom-test in Room 123');
      
      expect(result.plugins).toMatchObject({
        location: { room: '123' },
        custom: { value: 'test' },
      });
    });
  });
}); 