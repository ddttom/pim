import { jest } from '@jest/globals';
import ConfigManager from '../src/config/ConfigManager.js';

describe('Configuration Tests', () => {
  let configManager;
  let mockSettingsService;

  beforeEach(() => {
    mockSettingsService = {
      getAllSettings: jest.fn(),
      saveSetting: jest.fn(),
      saveAllSettings: jest.fn()
    };
    configManager = new ConfigManager(mockSettingsService);
  });

  test('merges settings with defaults', async () => {
    mockSettingsService.getAllSettings.mockResolvedValue({
      theme: 'dark',
      fontSize: 14
    });

    await configManager.load();
    
    expect(configManager.settings).toEqual({
      theme: 'dark',
      fontSize: 14,
      plugins: []
    });
  });

  test('applies environment variables', async () => {
    process.env.THEME = 'light';
    process.env.FONT_SIZE = '16';
    process.env.PLUGINS = 'plugin1,plugin2';

    mockSettingsService.getAllSettings.mockResolvedValue({});

    await configManager.load();
    
    expect(configManager.settings).toEqual({
      theme: 'light',
      fontSize: 16,
      plugins: ['plugin1', 'plugin2']
    });
  });

  test('validates settings', async () => {
    mockSettingsService.getAllSettings.mockResolvedValue({
      fontSize: 'invalid'
    });

    await expect(configManager.load())
      .rejects
      .toThrow('Invalid font size');
  });

  test('updates individual setting', async () => {
    await configManager.updateSetting('theme', 'dark');
    expect(mockSettingsService.saveSetting).toHaveBeenCalledWith('theme', 'dark');
  });

  test('creates and restores backup', async () => {
    mockSettingsService.getAllSettings.mockResolvedValue({
      theme: 'dark',
      fontSize: 14
    });

    await configManager.load();
    const backup = await configManager.createBackup();
    
    mockSettingsService.getAllSettings.mockResolvedValue({});
    await configManager.restoreBackup(backup);
    
    expect(configManager.settings).toEqual({
      theme: 'dark',
      fontSize: 14,
      plugins: []
    });
  });
});
