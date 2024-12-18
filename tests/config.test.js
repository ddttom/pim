const path = require('path');
const fs = require('fs').promises;
const { TEST_DIR } = require('./setup');
const SettingsService = require('../src/services/settings-service');
const ConfigManager = require('../src/config/ConfigManager');

describe('Configuration Tests', () => {
  let settingsService;
  let configManager;
  let configChangeEvents;
  
  beforeEach(async () => {
    // Initialize services
    settingsService = new SettingsService(TEST_DIR);
    await settingsService.initialize();
    
    configManager = new ConfigManager(settingsService);
    
    // Track config change events
    configChangeEvents = [];
    configManager.on('configChanged', (event) => {
      configChangeEvents.push(event);
    });
  });

  describe('Initialization', () => {
    test('loads default config when no settings exist', async () => {
      const config = await configManager.initialize();
      
      expect(config.parser.maxDepth).toBe(3);
      expect(config.parser.ignoreFiles).toEqual(['.git', 'node_modules']);
      expect(config.reminders.defaultMinutes).toBe(15);
    });

    test('merges settings with defaults', async () => {
      await settingsService.saveSetting('parser', {
        maxDepth: 5,
        customSetting: 'value'
      });

      const config = await configManager.initialize();
      
      expect(config.parser.maxDepth).toBe(5);
      expect(config.parser.ignoreFiles).toEqual(['.git', 'node_modules']);
      expect(config.parser.customSetting).toBe('value');
    });

    test('validates configuration on load', async () => {
      await settingsService.saveSetting('parser', {
        maxDepth: -1 // Invalid value
      });

      await expect(configManager.initialize()).rejects.toThrow('Invalid config value');
    });
  });

  describe('Settings Updates', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    test('updates and persists settings', async () => {
      await configManager.updateSettings('parser', {
        maxDepth: 5
      });

      // Verify in-memory update
      expect(configManager.get('parser').maxDepth).toBe(5);

      // Verify persisted update
      const savedSettings = await settingsService.getAllSettings();
      expect(savedSettings.parser.maxDepth).toBe(5);
    });

    test('emits change events', async () => {
      await configManager.updateSettings('parser', {
        maxDepth: 5
      });

      expect(configChangeEvents).toHaveLength(1);
      expect(configChangeEvents[0]).toEqual({
        category: 'parser',
        settings: { maxDepth: 5 }
      });
    });

    test('validates updates', async () => {
      await expect(
        configManager.updateSettings('parser', {
          maxDepth: -1
        })
      ).rejects.toThrow('Invalid config value');
    });
  });

  describe('Environment Variables', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    test('applies environment overrides', async () => {
      process.env['pim.parser.maxDepth'] = '10';
      
      await configManager.initialize();
      
      expect(configManager.get('parser').maxDepth).toBe(10);
    });

    test('validates environment values', async () => {
      process.env['pim.parser.maxDepth'] = '-1';
      
      await configManager.initialize();
      
      // Should keep default value
      expect(configManager.get('parser').maxDepth).toBe(3);
    });

    test('handles array values', async () => {
      process.env['pim.parser.ignoreFiles'] = '["temp","dist"]';
      
      await configManager.initialize();
      
      expect(configManager.get('parser').ignoreFiles).toEqual(['temp', 'dist']);
    });
  });

  describe('Backup and Restore', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    test('creates and restores backups', async () => {
      // Modify some settings
      await configManager.updateSettings('parser', {
        maxDepth: 5
      });

      // Create backup
      const originalConfig = { ...configManager.currentConfig };
      await configManager.backup();

      // Modify settings again
      await configManager.updateSettings('parser', {
        maxDepth: 10
      });

      // Restore from backup
      await configManager.restore(originalConfig);

      expect(configManager.get('parser').maxDepth).toBe(5);
    });

    test('validates backup data before restore', async () => {
      const invalidBackup = {
        parser: {
          maxDepth: -1
        }
      };

      await expect(
        configManager.restore(invalidBackup)
      ).rejects.toThrow('Invalid config value');
    });
  });
}); 
