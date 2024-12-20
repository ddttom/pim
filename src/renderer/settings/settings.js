import { showToast } from '../utils/toast.js';
import { applyTheme } from './themePresets.js';

// Default settings
export const defaultSettings = {
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
    spacing: 'comfortable'
  },
  sync: {
    enabled: false,
    provider: 'none',
    autoSync: false,
    syncInterval: 'daily',
    lastSync: null
  }
};

export function applySettings(settings = defaultSettings) {
  try {
    // Apply theme with fallback
    const themeName = settings?.theme?.name || 'light';
    document.body.className = themeName;
    applyTheme(themeName, settings);
    
    // Apply advanced settings with fallbacks
    const advanced = settings?.advanced || defaultSettings.advanced;
    document.documentElement.style.setProperty('--font-size', advanced.fontSize);
    document.documentElement.style.setProperty('--font-family', advanced.fontFamily);
    document.documentElement.style.setProperty('--border-radius', advanced.borderRadius);
    
    // Apply custom CSS if any
    if (advanced?.customCSS) {
      const customStyle = document.getElementById('custom-style') || document.createElement('style');
      customStyle.id = 'custom-style';
      customStyle.textContent = advanced.customCSS;
      document.head.appendChild(customStyle);
    }
  } catch (error) {
    console.error('Failed to apply settings:', error);
    showToast('Failed to apply settings', 'error');
  }
}

export async function exportSettings(settings) {
  try {
    const settingsJson = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `pim-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('Settings exported successfully');
  } catch (error) {
    showToast('Failed to export settings', 'error');
  }
}

export async function importSettings(file, api) {
  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedSettings = JSON.parse(e.target.result);
        await api.invoke('update-settings', importedSettings);
        showToast('Settings imported successfully');
      } catch (error) {
        showToast('Invalid settings file', 'error');
      }
    };
    reader.readAsText(file);
  } catch (error) {
    showToast('Failed to import settings', 'error');
  }
}
