const ConfigManager = require('../src/config/ConfigManager');
const MockDatabase = require('./__mocks__/database');

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
