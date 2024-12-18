import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SETTINGS_FILE = join(__dirname, '../../data/settings.json');

const defaultSettings = {
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
  dateFormat: 'medium',
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
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    return { ...defaultSettings, ...JSON.parse(data) };
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
    await fs.mkdir(dirname(SETTINGS_FILE), { recursive: true });
    
    // Merge with defaults to ensure all properties exist
    const mergedSettings = { ...defaultSettings, ...settings };
    
    // Save settings
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(mergedSettings, null, 2));
    return mergedSettings;
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

export { defaultSettings };
