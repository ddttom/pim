import { showToast } from '../utils/toast.js';

export function showSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (!modal) return;
  
  modal.classList.add('visible');
}

export function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (!modal) return;
  
  modal.classList.remove('visible');
}

export async function setupSettingsUI(settings, api) {
  const modalBody = document.querySelector('#settings-modal .modal-body');
  if (!modalBody) return;

  modalBody.innerHTML = `
    <div class="settings-section">
      <h3>Editor</h3>
      <div class="setting-item">
        <label>
          <input type="checkbox" id="setting-autosave" ${settings?.autosave ? 'checked' : ''}>
          Auto-save entries
        </label>
      </div>
      <div class="setting-item">
        <label>
          <input type="checkbox" id="setting-spellcheck" ${settings?.spellcheck ? 'checked' : ''}>
          Enable spell check
        </label>
      </div>
    </div>

    <div class="settings-section">
      <h3>Display</h3>
      <div class="setting-item">
        <label>Theme:</label>
        <select id="setting-theme">
          <option value="light" ${settings?.theme?.name === 'light' ? 'selected' : ''}>Light</option>
          <option value="dark" ${settings?.theme?.name === 'dark' ? 'selected' : ''}>Dark</option>
          <option value="system" ${settings?.theme?.name === 'system' ? 'selected' : ''}>System</option>
        </select>
      </div>
      <div class="setting-item">
        <label>Font Size:</label>
        <input type="range" id="setting-font-size" min="12" max="24" 
          value="${parseInt(settings?.advanced?.fontSize || '16')}">
        <span id="font-size-value">${settings?.advanced?.fontSize || '16px'}</span>
      </div>
      <div class="setting-item">
        <label>Font Family:</label>
        <select id="setting-font-family">
          <option value="system-ui">System Default</option>
          <option value="'Segoe UI'">Segoe UI</option>
          <option value="Roboto">Roboto</option>
          <option value="'SF Pro'">SF Pro</option>
        </select>
      </div>
      <div class="setting-item">
        <label>Date format:</label>
        <select id="setting-date-format">
          <option value="short">Short (MM/DD/YY)</option>
          <option value="medium">Medium (MMM DD, YYYY)</option>
          <option value="long">Long (MMMM DD, YYYY)</option>
        </select>
      </div>
    </div>

    <div class="settings-section">
      <h3>Cloud Sync</h3>
      <div class="setting-item">
        <label>
          <input type="checkbox" id="setting-sync-enabled" ${settings?.sync?.enabled ? 'checked' : ''}>
          Enable Cloud Sync
        </label>
      </div>
      <div class="setting-item">
        <label>Provider:</label>
        <select id="setting-sync-provider" ${!settings?.sync?.enabled ? 'disabled' : ''}>
          <option value="none">Select Provider</option>
          <option value="dropbox">Dropbox</option>
          <option value="google-drive">Google Drive</option>
          <option value="onedrive">OneDrive</option>
        </select>
      </div>
      <div class="setting-item">
        <label>
          <input type="checkbox" id="setting-autosync" ${!settings?.sync?.enabled ? 'disabled' : ''}>
          Auto Sync
        </label>
      </div>
      <div class="setting-item">
        <label>Sync Interval:</label>
        <select id="setting-sync-interval" ${!settings?.sync?.enabled || !settings?.sync?.autoSync ? 'disabled' : ''}>
          <option value="hourly">Every Hour</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
    </div>

    <div class="settings-section">
      <h3>Backup</h3>
      <div class="setting-item">
        <button id="backup-btn" class="secondary-btn">Create Backup</button>
        <button id="restore-btn" class="secondary-btn">Restore Backup</button>
      </div>
    </div>
  `;

  // Setup event handlers
  setupSettingsEventHandlers(settings, api);
}

function setupSettingsEventHandlers(settings, api) {
  // Sync settings handlers
  const syncEnabled = document.getElementById('setting-sync-enabled');
  if (syncEnabled) {
    syncEnabled.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      document.getElementById('setting-sync-provider').disabled = !enabled;
      document.getElementById('setting-autosync').disabled = !enabled;
      
      if (!enabled) {
        document.getElementById('setting-sync-interval').disabled = true;
        document.getElementById('setting-autosync').checked = false;
      }
    });
  }

  // Auto sync handler
  const autoSync = document.getElementById('setting-autosync');
  if (autoSync) {
    autoSync.addEventListener('change', (e) => {
      document.getElementById('setting-sync-interval').disabled = !e.target.checked;
    });
  }

  // Font size range handler
  const fontSizeInput = document.getElementById('setting-font-size');
  const fontSizeValue = document.getElementById('font-size-value');
  
  if (fontSizeInput && fontSizeValue) {
    fontSizeInput.addEventListener('input', (e) => {
      fontSizeValue.textContent = `${e.target.value}px`;
    });
  }
}

export async function saveSettings(settings, api) {
  try {
    const updates = {
      ...settings,
      autosave: document.getElementById('setting-autosave')?.checked ?? false,
      spellcheck: document.getElementById('setting-spellcheck')?.checked ?? true,
      theme: {
        name: document.getElementById('setting-theme')?.value || 'light',
        custom: settings.theme?.custom || {}
      },
      dateFormat: document.getElementById('setting-date-format')?.value || 'medium',
      advanced: {
        fontSize: `${document.getElementById('setting-font-size')?.value || 16}px`,
        fontFamily: document.getElementById('setting-font-family')?.value || 'system-ui',
        borderRadius: '4px',
        spacing: 'comfortable',
        sidebarCollapsed: settings.advanced?.sidebarCollapsed || false
      },
      sync: {
        enabled: document.getElementById('setting-sync-enabled')?.checked ?? false,
        provider: document.getElementById('setting-sync-provider')?.value || 'none',
        autoSync: document.getElementById('setting-autosync')?.checked ?? false,
        syncInterval: document.getElementById('setting-sync-interval')?.value || 'daily',
        lastSync: settings.sync?.lastSync || null
      }
    };

    await api.invoke('update-settings', updates);
    closeSettingsModal();
    showToast('Settings saved successfully');
    return updates;
  } catch (error) {
    console.error('Failed to save settings:', error);
    showToast('Failed to save settings', 'error');
    throw error;
  }
}
