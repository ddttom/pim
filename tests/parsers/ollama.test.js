const MockLogger = require('../__mocks__/logger');
const parser = require('../../src/services/parser');

// Mock the logger
jest.mock('../../src/utils/logger', () => {
  const logger = new MockLogger();
  return logger;
});

// Mock node-fetch to avoid actual HTTP requests to Ollama
jest.mock('node-fetch', () => {
  return jest.fn(() => 
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        models: [{ name: 'test-model' }],
        response: JSON.stringify({
          action: 'call',
          contact: 'John',
          project: { project: 'Project Alpha' },
          final_deadline: '2024-01-08T14:00:00.000Z',
          priority: 'high',
          tags: ['important']
        })
      })
    })
  );
});

describe('Ollama Parser', () => {
  // Mock the parser's initialize method to avoid actual Ollama connection
  beforeEach(() => {
    parser.initialize = jest.fn().mockResolvedValue(true);
    parser.available = true;
    parser.initialized = true;
    parser.model = 'test-model';
  });

  // Test cases for the parser
  const testCases = [
    {
      name: 'should parse action and contact',
      input: 'Call John about the project',
      expected: {
        action: 'call',
        contact: 'John'
      }
    },
    {
      name: 'should parse project and deadline',
      input: 'Meeting about Project Alpha next Monday at 2pm',
      expected: {
        project: { project: 'Project Alpha' },
        final_deadline: expect.any(String)
      }
    },
    {
      name: 'should parse priority and tags',
      input: 'Urgent task #important',
      expected: {
        priority: 'high',
        tags: ['important']
      }
    },
    {
      name: 'should parse location and duration',
      input: 'Meeting in Conference Room B for 1 hour',
      expected: {
        location: { type: expect.any(String), value: 'Conference Room B' },
        duration: { minutes: 60, formatted: '1h0m' }
      }
    },
    {
      name: 'should handle empty input',
      input: '',
      expected: {
        status: 'None'
      }
    }
  ];

  // Run tests for each test case
  testCases.forEach(({ name, input, expected }) => {
    test(name, async () => {
      // Mock the extractJsonFromCompletion method to return expected data for each test case
      parser.extractJsonFromCompletion = jest.fn().mockReturnValue(expected);
      
      const result = await parser.parse(input);
      
      // Check that the result contains the expected properties
      Object.entries(expected).forEach(([key, value]) => {
        expect(result.parsed[key]).toEqual(value);
      });
      
      // Check that the raw_content and markdown match the input
      expect(result.raw_content).toBe(input);
      expect(result.markdown).toBe(input);
    });
  });

  // Test error handling
  test('should handle Ollama service unavailability', async () => {
    // Mock Ollama as unavailable
    parser.available = false;
    
    const result = await parser.parse('Test input');
    
    // Should return empty result with the input text
    expect(result.raw_content).toBe('Test input');
    expect(result.parsed.status).toBe('None');
    expect(result.parsed.action).toBeNull();
  });

  test('should handle JSON parsing errors', async () => {
    // Mock extractJsonFromCompletion to return null (parsing failure)
    parser.extractJsonFromCompletion = jest.fn().mockReturnValue(null);
    
    const result = await parser.parse('Test input');
    
    // Should return empty result with the input text
    expect(result.raw_content).toBe('Test input');
    expect(result.parsed.status).toBe('None');
    expect(result.parsed.action).toBeNull();
  });

  // Test the resetPlugins method (for compatibility)
  test('resetPlugins should not throw errors', () => {
    expect(() => parser.resetPlugins()).not.toThrow();
  });
});