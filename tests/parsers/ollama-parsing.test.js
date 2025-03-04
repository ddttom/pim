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
        response: '```json\n{"result": "success"}\n```'
      })
    })
  );
});

describe('Ollama Parser - Metadata Extraction', () => {
  // Setup mocks before each test
  beforeEach(() => {
    // Mock the parser's initialize method
    parser.initialize = jest.fn().mockResolvedValue(true);
    parser.available = true;
    parser.initialized = true;
    parser.model = 'test-model';
  });

  // Test action parsing
  test('should parse action metadata', async () => {
    // Mock the extractJsonFromCompletion method to return action data
    parser.extractJsonFromCompletion = jest.fn().mockReturnValue({
      action: 'call'
    });
    
    const result = await parser.parse('Call John');
    
    expect(result.parsed.action).toBe('call');
  });

  // Test contact parsing
  test('should parse contact metadata', async () => {
    parser.extractJsonFromCompletion = jest.fn().mockReturnValue({
      contact: 'John'
    });
    
    const result = await parser.parse('Call John');
    
    expect(result.parsed.contact).toBe('John');
  });

  // Test project parsing
  test('should parse project metadata', async () => {
    parser.extractJsonFromCompletion = jest.fn().mockReturnValue({
      project: { project: 'Project Alpha' }
    });
    
    const result = await parser.parse('Meeting about Project Alpha');
    
    expect(result.parsed.project.project).toBe('Project Alpha');
  });

  // Test date parsing
  test('should parse date metadata', async () => {
    const isoDate = '2024-01-08T14:00:00.000Z';
    parser.extractJsonFromCompletion = jest.fn().mockReturnValue({
      final_deadline: isoDate
    });
    
    const result = await parser.parse('Meeting next Monday at 2pm');
    
    expect(result.parsed.final_deadline).toBe(isoDate);
  });

  // Test location parsing
  test('should parse location metadata', async () => {
    parser.extractJsonFromCompletion = jest.fn().mockReturnValue({
      location: { type: 'room', value: 'Conference Room B' }
    });
    
    const result = await parser.parse('Meeting in Conference Room B');
    
    expect(result.parsed.location.type).toBe('room');
    expect(result.parsed.location.value).toBe('Conference Room B');
  });

  // Test duration parsing
  test('should parse duration metadata', async () => {
    parser.extractJsonFromCompletion = jest.fn().mockReturnValue({
      duration: { minutes: 60, formatted: '1h0m' }
    });
    
    const result = await parser.parse('Meeting for 1 hour');
    
    expect(result.parsed.duration.minutes).toBe(60);
    expect(result.parsed.duration.formatted).toBe('1h0m');
  });

  // Test priority parsing
  test('should parse priority metadata', async () => {
    parser.extractJsonFromCompletion = jest.fn().mockReturnValue({
      priority: 'high'
    });
    
    const result = await parser.parse('Urgent task');
    
    expect(result.parsed.priority).toBe('high');
  });

  // Test tags parsing
  test('should parse tags metadata', async () => {
    parser.extractJsonFromCompletion = jest.fn().mockReturnValue({
      tags: ['important', 'urgent']
    });
    
    const result = await parser.parse('Task #important #urgent');
    
    expect(result.parsed.tags).toEqual(['important', 'urgent']);
  });

  // Test status parsing
  test('should parse status metadata', async () => {
    parser.extractJsonFromCompletion = jest.fn().mockReturnValue({
      status: 'Started'
    });
    
    const result = await parser.parse('Task - started');
    
    expect(result.parsed.status).toBe('Started');
  });

  // Test participants parsing
  test('should parse participants metadata', async () => {
    parser.extractJsonFromCompletion = jest.fn().mockReturnValue({
      participants: ['john', 'sarah']
    });
    
    const result = await parser.parse('Meeting with @john and @sarah');
    
    expect(result.parsed.participants).toEqual(['john', 'sarah']);
  });

  // Test complex parsing with multiple metadata types
  test('should parse complex text with multiple metadata types', async () => {
    parser.extractJsonFromCompletion = jest.fn().mockReturnValue({
      action: 'call',
      contact: 'John',
      project: { project: 'Project Alpha' },
      final_deadline: '2024-01-08T14:00:00.000Z',
      priority: 'high',
      tags: ['important']
    });
    
    const result = await parser.parse('Call John about Project Alpha next Monday at 2pm #important');
    
    expect(result.parsed.action).toBe('call');
    expect(result.parsed.contact).toBe('John');
    expect(result.parsed.project.project).toBe('Project Alpha');
    expect(result.parsed.final_deadline).toBe('2024-01-08T14:00:00.000Z');
    expect(result.parsed.priority).toBe('high');
    expect(result.parsed.tags).toEqual(['important']);
  });

  // Test JSON parsing and extraction
  test('should extract JSON from Ollama response', () => {
    // Test with JSON in code block
    const jsonInCodeBlock = '```json\n{"action": "call", "contact": "John"}\n```';
    const result1 = parser.extractJsonFromCompletion(jsonInCodeBlock);
    expect(result1).toEqual({ action: 'call', contact: 'John' });
    
    // Test with JSON without language identifier
    const jsonWithoutLanguage = '```\n{"action": "call", "contact": "John"}\n```';
    const result2 = parser.extractJsonFromCompletion(jsonWithoutLanguage);
    expect(result2).toEqual({ action: 'call', contact: 'John' });
    
    // Test with direct JSON
    const directJson = '{"action": "call", "contact": "John"}';
    const result3 = parser.extractJsonFromCompletion(directJson);
    expect(result3).toEqual({ action: 'call', contact: 'John' });
  });

  // Test JSON cleaning and fixing
  test('should clean and fix malformed JSON', () => {
    // Test with unquoted property names
    const unquotedProps = '{ action: "call", contact: "John" }';
    const result1 = parser.cleanJsonString(unquotedProps);
    expect(JSON.parse(result1)).toEqual({ action: 'call', contact: 'John' });
    
    // Test with trailing commas
    const trailingCommas = '{ "action": "call", "contact": "John", }';
    const result2 = parser.cleanJsonString(trailingCommas);
    expect(JSON.parse(result2)).toEqual({ action: 'call', contact: 'John' });
    
    // Test with single quotes
    const singleQuotes = "{ 'action': 'call', 'contact': 'John' }";
    const result3 = parser.cleanJsonString(singleQuotes);
    expect(JSON.parse(result3)).toEqual({ action: 'call', contact: 'John' });
  });
});