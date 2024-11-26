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
