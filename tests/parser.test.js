const ConfigManager = require('../src/config/ConfigManager');
const MockDatabase = require('./__mocks__/database');
const Parser = require('../src/services/parser');

describe('Parser Config Tests', () => {
  let configManager;
  let mockDb;
  let originalEnv;
  let logMessages;

  beforeEach(async () => {
    // Save original environment and console
    originalEnv = { ...process.env };
    
    // Initialize log messages array
    logMessages = [];
    
    // Mock console methods
    const originalConsole = { ...console };
    console.log = jest.fn((...args) => logMessages.push(args.join(' ')));
    console.warn = jest.fn((...args) => logMessages.push(args.join(' ')));
    console.error = jest.fn((...args) => logMessages.push(args.join(' ')));
    
    // Reset environment variables
    process.env = {
      NODE_ENV: 'test'
    };
    
    mockDb = new MockDatabase();
    configManager = new ConfigManager(mockDb);
    await configManager.initialize();
  });

  afterEach(() => {
    // Restore original environment and console
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  test('should use default config values', () => {
    const parserConfig = configManager.get('parser');
    expect(parserConfig.maxDepth).toBe(3);
    expect(parserConfig.ignoreFiles).toContain('node_modules');
  });

  test('should validate config updates', async () => {
    await expect(configManager.updateSettings('parser', {
      maxDepth: -1 // invalid value
    })).rejects.toThrow('Invalid value for parser.maxDepth');
  });

  describe('Environment Variable Tests', () => {
    test('should override number value from environment', async () => {
      process.env['pim.parser.maxDepth'] = '5';
      process.env.DEBUG = 'true'; // Enable debug logging for this test
      
      await configManager.initialize();
      
      const config = configManager.get('parser');
      expect(config.maxDepth).toBe(5);
    });

    test('should override boolean value from environment', async () => {
      process.env['pim.parser.tellTruth'] = 'false';
      await configManager.initialize();
      
      const config = configManager.get('parser');
      expect(config.tellTruth).toBe(false);
    });

    test('should override array value from environment', async () => {
      process.env['pim.parser.ignoreFiles'] = '["test", "dist"]';
      await configManager.initialize();
      
      const config = configManager.get('parser');
      expect(config.ignoreFiles).toEqual(['test', 'dist']);
    });

    test('should handle invalid environment value silently in test mode', async () => {
      process.env['pim.parser.maxDepth'] = 'not-a-number';
      await configManager.initialize();
      
      const config = configManager.get('parser');
      expect(config.maxDepth).toBe(3); // Should fall back to default
    });

    test('should handle invalid JSON in array environment value silently in test mode', async () => {
      process.env['pim.parser.ignoreFiles'] = 'not-valid-json';
      await configManager.initialize();
      
      const config = configManager.get('parser');
      expect(config.ignoreFiles).toEqual(['.git', 'node_modules']); // Should fall back to default
    });

    test('should override multiple settings from environment', async () => {
      process.env['pim.parser.maxDepth'] = '10';
      process.env['pim.parser.tellTruth'] = 'false';
      process.env['pim.parser.ignoreFiles'] = '["env-test"]';
      
      await configManager.initialize();
      
      const config = configManager.get('parser');
      expect(config.maxDepth).toBe(10);
      expect(config.tellTruth).toBe(false);
      expect(config.ignoreFiles).toEqual(['env-test']);
    });

    test('should respect environment variable priority over database', async () => {
      // Set up database value
      await mockDb.saveSetting('parser', { maxDepth: 4 });
      
      // Set environment variable
      process.env['pim.parser.maxDepth'] = '5';
      
      await configManager.initialize();
      
      const config = configManager.get('parser');
      expect(config.maxDepth).toBe(5); // Environment should win
    });

    test('should ignore invalid environment variable format', async () => {
      process.env['pim.invalid.format'] = 'test';
      process.env['pim.parser'] = 'invalid';
      process.env['pim'] = 'invalid';
      
      await configManager.initialize();
      
      const config = configManager.get('parser');
      expect(config.maxDepth).toBe(3); // Should use default
    });

    test('should show debug logs when DEBUG is enabled', async () => {
      // Enable debug logging and disable test mode for this specific test
      process.env.DEBUG = 'true';
      process.env.NODE_ENV = 'development';
      
      process.env['pim.parser.maxDepth'] = '5';
      
      // Create new instance with debug enabled
      const debugConfigManager = new ConfigManager(mockDb);
      await debugConfigManager.initialize();

      expect(logMessages).toContain('Environment override: pim.parser.maxDepth=5');
    });
  });
});

describe('Parser Tests', () => {
    let parser;
    let mockLogger;
    let mockNow;

    beforeEach(() => {
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        // Set up mock date
        mockNow = new Date('2024-01-01T12:00:00.000Z');
        jest.spyOn(global, 'Date').mockImplementation(() => mockNow);

        parser = new Parser(mockLogger);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Status Parsing', () => {
        test('should default to None status', () => {
            const result = parser.parse('Call John');
            expect(result.parsed.status).toBe('None');
        });

        test('should parse Blocked status', () => {
            const result = parser.parse('Call John - blocked by network issues');
            expect(result.parsed.status).toBe('Blocked');
        });

        test('should parse Complete status', () => {
            const result = parser.parse('Call John - complete');
            expect(result.parsed.status).toBe('Complete');
        });

        test('should parse Started status', () => {
            const result = parser.parse('Call John - started');
            expect(result.parsed.status).toBe('Started');
        });

        test('should parse Closed status', () => {
            const result = parser.parse('Call John - closed');
            expect(result.parsed.status).toBe('Closed');
        });

        test('should parse Abandoned status', () => {
            const result = parser.parse('Call John - abandoned');
            expect(result.parsed.status).toBe('Abandoned');
        });
    });

    describe('Date Parsing', () => {
        test('should parse "next week"', () => {
            const result = parser.parse('Call John next week');
            expect(result.parsed.final_deadline).toBe('2024-01-08T09:00:00.000Z');
        });

        test('should set time to 9 AM when no time specified', () => {
            const result = parser.parse('Meet Sarah tomorrow');
            expect(result.parsed.final_deadline).toBe('2024-01-02T09:00:00.000Z');
        });

        test('should handle "now" keyword', () => {
            const result = parser.parse('Call John now');
            expect(result.parsed.final_deadline).toBe('2024-01-01T12:00:00.000Z');
        });
    });

    describe('Action Parsing', () => {
        test('should parse call action', () => {
            const result = parser.parse('Call John');
            expect(result.parsed.action).toBe('call');
        });

        test('should parse text action', () => {
            const result = parser.parse('Text Sarah');
            expect(result.parsed.action).toBe('text');
        });

        test('should parse meet action', () => {
            const result = parser.parse('Meet with team');
            expect(result.parsed.action).toBe('meet');
        });

        test('should handle action at start of text', () => {
            const result = parser.parse('email John about project');
            expect(result.parsed.action).toBe('email');
        });
    });

    describe('Project Parsing', () => {
        test('should parse project from "about project" format', () => {
            const result = parser.parse('Call John about project Cheesecake');
            expect(result.parsed.project.project).toBe('Cheesecake');
        });

        test('should parse project from "Project X" format', () => {
            const result = parser.parse('Project Alpha meeting tomorrow');
            expect(result.parsed.project.project).toBe('Alpha');
        });

        test('should handle multi-word project names', () => {
            const result = parser.parse('about project Big Launch');
            expect(result.parsed.project.project).toBe('Big Launch');
        });
    });

    describe('Contact Parsing', () => {
        test('should parse contact after action', () => {
            const result = parser.parse('Call John about project');
            expect(result.parsed.contact).toBe('John');
        });

        test('should parse contact after with', () => {
            const result = parser.parse('Meeting with Sarah tomorrow');
            expect(result.parsed.contact).toBe('Sarah');
        });

        test('should not parse common words as contacts', () => {
            const result = parser.parse('Call me later');
            expect(result.parsed.contact).toBeUndefined();
        });
    });

    describe('Full Text Parsing', () => {
        test('should parse complex entry with multiple components', () => {
            const result = parser.parse('Call John about project Cheesecake next week - started');
            
            expect(result.parsed.action).toBe('call');
            expect(result.parsed.contact).toBe('John');
            expect(result.parsed.project.project).toBe('Cheesecake');
            expect(result.parsed.status).toBe('Started');
            expect(result.parsed.final_deadline).toBeDefined();
        });

        test('should handle empty input', () => {
            const result = parser.parse('');
            expect(result.raw_content).toBe('');
            expect(result.parsed.status).toBe('None');
        });

        test('should handle null input', () => {
            const result = parser.parse(null);
            expect(result.raw_content).toBe('');
            expect(result.parsed.status).toBe('None');
        });
    });
});

describe('Parser', () => {
  let parser;

  beforeEach(() => {
    parser = new Parser();
  });

  test('parses all facets correctly', () => {
    const text = `Meet @john and @sarah about #project-alpha tomorrow at 2pm in conference room
                 for 1 hour. High priority. Status: in-progress
                 Links: https://example.com file://docs/spec.pdf
                 #work #meeting`;

    const result = parser.parse(text);

    expect(result).toEqual({
      raw_content: text,
      markdown: text,
      parsed: {
        action: 'meet',
        contact: 'john',
        project: { project: 'project-alpha' },
        final_deadline: expect.any(String), // tomorrow at 2pm
        participants: ['john', 'sarah'],
        tags: ['project-alpha', 'work', 'meeting'],
        priority: 'high',
        status: 'in-progress',
        location: 'conference room',
        duration: { hours: 1 },
        recurrence: null,
        contexts: ['work'],
        categories: ['meeting'],
        images: [],
        links: [
          'https://example.com',
          'file://docs/spec.pdf'
        ]
      }
    });
  });

  test('handles missing facets gracefully', () => {
    const text = 'Simple note without any special attributes';
    const result = parser.parse(text);

    expect(result.parsed).toEqual({
      action: null,
      contact: null,
      project: null,
      final_deadline: null,
      participants: [],
      tags: [],
      priority: 'normal',
      status: 'pending',
      location: null,
      duration: null,
      recurrence: null,
      contexts: [],
      categories: [],
      images: [],
      links: []
    });
  });
});

describe('Parser Facet Tests', () => {
  let parser;

  beforeEach(() => {
    parser = new Parser();
  });

  describe('Links Parsing', () => {
    test('parses web links', () => {
      const text = 'Check https://example.com and http://test.org';
      const result = parser.parse(text);
      expect(result.parsed.links).toEqual([
        'https://example.com',
        'http://test.org'
      ]);
    });

    test('parses file links', () => {
      const text = 'See file://docs/report.pdf and file://images/diagram.png';
      const result = parser.parse(text);
      expect(result.parsed.links).toEqual([
        'file://docs/report.pdf',
        'file://images/diagram.png'
      ]);
    });
  });

  describe('Participants Parsing', () => {
    test('extracts multiple participants', () => {
      const text = 'Meeting with @john @sarah and @mike';
      const result = parser.parse(text);
      expect(result.parsed.participants).toEqual(['john', 'sarah', 'mike']);
    });

    test('handles duplicate participants', () => {
      const text = 'Call @john and @john again';
      const result = parser.parse(text);
      expect(result.parsed.participants).toEqual(['john']);
    });
  });

  describe('Location Parsing', () => {
    test('parses "at" locations', () => {
      const text = 'Meet at Coffee Shop';
      const result = parser.parse(text);
      expect(result.parsed.location).toEqual({
        type: 'location',
        value: 'Coffee Shop'
      });
    });

    test('parses "in" locations', () => {
      const text = 'Meeting in Conference Room B';
      const result = parser.parse(text);
      expect(result.parsed.location).toEqual({
        type: 'location',
        value: 'Conference Room B'
      });
    });

    test('parses location with colon', () => {
      const text = 'Team sync location: Main Office';
      const result = parser.parse(text);
      expect(result.parsed.location).toEqual({
        type: 'location',
        value: 'Main Office'
      });
    });
  });

  describe('Duration Parsing', () => {
    test('parses hour durations', () => {
      const text = 'Meeting for 2 hours';
      const result = parser.parse(text);
      expect(result.parsed.duration).toEqual({
        minutes: 120,
        formatted: '2h0m'
      });
    });

    test('parses minute durations', () => {
      const text = 'Call for 45 minutes';
      const result = parser.parse(text);
      expect(result.parsed.duration).toEqual({
        minutes: 45,
        formatted: '0h45m'
      });
    });

    test('handles abbreviated units', () => {
      const text = 'Meeting for 1 hr and call for 30 min';
      const result = parser.parse(text);
      expect(result.parsed.duration).toEqual({
        minutes: 60,
        formatted: '1h0m'
      });
    });
  });

  describe('Recurrence Parsing', () => {
    test('parses daily recurrence', () => {
      const text = 'Standup every day at 10am';
      const result = parser.parse(text);
      expect(result.parsed.recurrence).toEqual({
        type: 'daily',
        interval: 1
      });
    });

    test('parses weekly recurrence', () => {
      const text = 'Team sync every week';
      const result = parser.parse(text);
      expect(result.parsed.recurrence).toEqual({
        type: 'weekly',
        interval: 1
      });
    });

    test('parses specific day recurrence', () => {
      const text = 'Meeting every monday';
      const result = parser.parse(text);
      expect(result.parsed.recurrence).toEqual({
        type: 'specific',
        day: 'monday',
        interval: 1
      });
    });
  });

  describe('Context Detection', () => {
    test('detects work context', () => {
      const text = 'Client meeting about project deadline';
      const result = parser.parse(text);
      expect(result.parsed.contexts).toContain('work');
    });

    test('detects personal context', () => {
      const text = 'Family birthday party at home';
      const result = parser.parse(text);
      expect(result.parsed.contexts).toContain('personal');
    });

    test('detects multiple contexts', () => {
      const text = 'Doctor appointment and client meeting';
      const result = parser.parse(text);
      expect(result.parsed.contexts).toEqual(
        expect.arrayContaining(['health', 'work'])
      );
    });
  });
});
