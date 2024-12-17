const path = require('path');
const fs = require('fs').promises;
const { app } = require('electron');
const { TEST_DIR } = require('./setup');
const SettingsService = require('../src/services/settings-service');
const ConfigManager = require('../src/config/ConfigManager');
const JsonDatabaseService = require('../src/services/json-database');

describe('Configuration and Database Tests', () => {
  let settingsService;
  let configManager;
  let dbService;
  
  beforeEach(async () => {
    // Use test-specific filenames
    const testId = Date.now();
    const settingsPath = path.join(TEST_DIR, `settings.test.${testId}.json`);
    const dbPath = path.join(TEST_DIR, `pim.test.${testId}.json`);
    
    // Initialize services with test paths
    settingsService = new SettingsService(TEST_DIR);
    settingsService.settingsPath = settingsPath;
    
    configManager = new ConfigManager(settingsService, settingsPath);
    
    dbService = new JsonDatabaseService();
    await dbService.initialize(dbPath);
  });

  afterEach(async () => {
    // Clean up test files
    const files = await fs.readdir(TEST_DIR);
    await Promise.all(
      files
        .filter(f => f.includes('.test.'))
        .map(f => fs.unlink(path.join(TEST_DIR, f)))
    );
  });

  describe('Settings Service', () => {
    test('saves and loads settings correctly', async () => {
      const testSettings = {
        parser: {
          maxDepth: 5,
          ignoreFiles: ['.git']
        }
      };

      await settingsService.saveAllSettings(testSettings);
      const loaded = await settingsService.getAllSettings();
      
      expect(loaded).toEqual(testSettings);
    });

    test('updates individual settings', async () => {
      await settingsService.saveSetting('parser', { maxDepth: 3 });
      await settingsService.saveSetting('parser', { ignoreFiles: ['.git'] });
      
      const settings = await settingsService.getAllSettings();
      expect(settings.parser).toEqual({
        maxDepth: 3,
        ignoreFiles: ['.git']
      });
    });
  });

  describe('Config Manager', () => {
    test('applies environment variables over saved settings', async () => {
      // Save base settings
      await settingsService.saveSetting('parser', {
        maxDepth: 3,
        ignoreFiles: ['.git']
      });

      // Set environment variable
      process.env['pim.parser.maxDepth'] = '5';
      
      await configManager.initialize();
      
      expect(configManager.get('parser').maxDepth).toBe(5);
      expect(configManager.get('parser').ignoreFiles).toEqual(['.git']);
      
      // Cleanup
      delete process.env['pim.parser.maxDepth'];
    });

    test('validates settings on update', async () => {
      await expect(
        configManager.updateSettings('parser', { maxDepth: -1 })
      ).rejects.toThrow();
    });
  });

  describe('Database Service', () => {
    test('saves and retrieves entries', async () => {
      const testEntry = {
        content: 'Test task',
        parsed: {
          status: 'pending',
          priority: 'high'
        }
      };

      const id = await dbService.addEntry(testEntry);
      const retrieved = await dbService.getEntry(id);
      
      expect(retrieved.content).toBe(testEntry.content);
      expect(retrieved.parsed).toEqual(testEntry.parsed);
    });

    test('filters entries correctly', async () => {
      const entries = [
        { parsed: { status: 'pending', priority: 'high' } },
        { parsed: { status: 'complete', priority: 'low' } }
      ];

      for (const entry of entries) {
        await dbService.addEntry(entry);
      }

      const filters = {
        status: new Set(['pending'])
      };

      const filtered = await dbService.getEntries(filters);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].parsed.status).toBe('pending');
    });

    test('updates entries', async () => {
      const id = await dbService.addEntry({ content: 'Original' });
      await dbService.updateEntry(id, { content: 'Updated' });
      
      const entry = await dbService.getEntry(id);
      expect(entry.content).toBe('Updated');
    });
  });
}); 
