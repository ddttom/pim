import { dirname, join } from 'path';
import { promises as fs } from 'fs';

let settingsPath;

export function setSettingsPath(path) {
  settingsPath = path;
}

export const defaultSettings = {
  dataPath: null, // Will be set by ConfigManager
  autosave: false,
  spellcheck: true,
  theme: {
    name: 'light',
    custom: {
      primary: '#3498db',
      secondary: '#95a5a6',
      background: '#f5f5f5',
      text: '#333333',
      accent: '#2ecc71'
    }
  },
  dateFormat: 'system',
  shortcuts: {
    enabled: true,
    custom: {
      'newEntry': 'ctrl+n',
      'save': 'ctrl+s',
      'search': 'ctrl+f',
      'settings': 'ctrl+,',
      'bold': 'ctrl+b',
      'italic': 'ctrl+i',
      'underline': 'ctrl+u',
      'undo': 'ctrl+z',
      'redo': 'ctrl+shift+z'
    }
  },
  advanced: {
    fontSize: '16px',
    fontFamily: 'system-ui',
    borderRadius: '4px',
    spacing: 'comfortable',
    sidebarCollapsed: false
  },
  sync: {
    enabled: false,
    provider: 'none',
    autoSync: false,
    syncInterval: 'daily',
    lastSync: null
  }
};

export async function getSettings() {
  try {
    const data = await fs.readFile(settingsPath, 'utf8');
    const settings = { ...defaultSettings, ...JSON.parse(data) };
    
    // Don't override dataPath from settings file
    delete settings.dataPath;
    
    return settings;
  } catch (error) {
    // If file doesn't exist or is invalid, return default settings
    if (error.code === 'ENOENT' || error instanceof SyntaxError) {
      // Create settings file with defaults
      await saveSettings(defaultSettings);
      return defaultSettings;
    }
    throw error;
  }
}

export async function saveSettings(settings) {
  try {
    // Ensure directory exists
    await fs.mkdir(dirname(settingsPath), { recursive: true });
    
    // Merge with defaults to ensure all properties exist
    const mergedSettings = {
      ...defaultSettings,
      ...settings,
      // Ensure nested objects are properly merged
      theme: { ...defaultSettings.theme, ...settings.theme },
      shortcuts: { ...defaultSettings.shortcuts, ...settings.shortcuts },
      advanced: { ...defaultSettings.advanced, ...settings.advanced },
      sync: { ...defaultSettings.sync, ...settings.sync }
    };
    
    // Don't save dataPath in settings file
    delete mergedSettings.dataPath;
    
    // Save settings
    await fs.writeFile(settingsPath, JSON.stringify(mergedSettings, null, 2));
    return mergedSettings;
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}
