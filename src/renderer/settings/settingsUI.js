import { showToast } from '../utils/toast.js';

export async function setupSettingsUI(container, settings, api) {
  if (!container) return;

  container.innerHTML = `
    <div class="settings-container">
      <div class="settings-sidebar">
        <ul class="settings-nav">
          <li class="settings-nav-item active" data-section="editor">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
            </svg>
            Editor
          </li>
          <li class="settings-nav-item" data-section="appearance">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z" fill="currentColor"/>
              <path d="M12 17c2.76 0 5-2.24 5-5s-2.24-5-5-5v10z" fill="currentColor"/>
            </svg>
            Appearance
          </li>
          <li class="settings-nav-item" data-section="sync">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill="currentColor"/>
            </svg>
            Sync & Backup
          </li>
          <li class="settings-nav-item" data-section="advanced">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor"/>
            </svg>
            Advanced
          </li>
        </ul>
      </div>
      <div class="settings-content">
        <div class="settings-section active" data-section="editor">
          <h3>Editor Settings</h3>
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

        <div class="settings-section" data-section="appearance">
          <h3>Appearance Settings</h3>
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
        </div>

        <div class="settings-section" data-section="sync">
          <h3>Sync & Backup Settings</h3>
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
          <div class="setting-item backup-section">
            <h4>Backup</h4>
            <div class="button-group">
              <button id="backup-btn" class="secondary-btn">Create Backup</button>
              <button id="restore-btn" class="secondary-btn">Restore Backup</button>
            </div>
          </div>
        </div>

        <div class="settings-section" data-section="advanced">
          <h3>Advanced Settings</h3>
          <div class="setting-item">
            <label>Data Path:</label>
            <div class="setting-path-info">
              <p class="current-path">Current path: ${await window.api.invoke('get-data-path')}</p>
              <button id="change-path-btn" class="secondary-btn">Change Path</button>
            </div>
          </div>
          <div class="setting-item">
            <label>Date Format:</label>
            <select id="setting-date-format">
              <option value="system">System Default (${new Intl.DateTimeFormat().format(new Date())})</option>
              <option value="us-short">US Short (MM/DD/YY)</option>
              <option value="us-medium">US Medium (MMM DD, YYYY)</option>
              <option value="us-long">US Long (MMMM DD, YYYY)</option>
              <option value="eu-short">EU Short (DD/MM/YY)</option>
              <option value="eu-medium">EU Medium (DD MMM YYYY)</option>
              <option value="eu-long">EU Long (DD MMMM YYYY)</option>
              <option value="iso">ISO (YYYY-MM-DD)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;

  // Setup event handlers
  setupSettingsEventHandlers(settings, api);
}

function setupSettingsEventHandlers(settings, api) {
  // Settings navigation
  const navItems = document.querySelectorAll('.settings-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Show corresponding section
      const sectionId = item.getAttribute('data-section');
      const sections = document.querySelectorAll('.settings-section');
      sections.forEach(section => {
        section.classList.toggle('active', section.getAttribute('data-section') === sectionId);
      });
    });
  });

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

  // Copy settings button handler
  const copySettingsBtn = document.getElementById('copy-settings-btn');
  if (copySettingsBtn) {
    copySettingsBtn.addEventListener('click', async () => {
      try {
        const currentSettings = await api.invoke('get-settings');
        await api.invoke('copy-to-clipboard', JSON.stringify(currentSettings, null, 2));
        showToast('Settings copied to clipboard');
      } catch (error) {
        console.error('Failed to copy settings:', error);
        showToast('Failed to copy settings', 'error');
      }
    });
  }

  // Change data path button handler
  const changePathBtn = document.getElementById('change-path-btn');
  if (changePathBtn) {
    changePathBtn.addEventListener('click', async () => {
      try {
        const result = await api.invoke('show-open-dialog', {
          properties: ['openDirectory', 'createDirectory'],
          title: 'Select Data Directory'
        });

        if (!result.canceled && result.filePaths.length > 0) {
          const newPath = result.filePaths[0];
          const confirmed = await api.invoke('change-data-path', newPath);
          if (confirmed) {
            document.getElementById('setting-data-path').value = newPath;
            showToast('Data path updated. Restart app to apply changes.');
          }
        }
      } catch (error) {
        console.error('Failed to change data path:', error);
        showToast('Failed to change data path', 'error');
      }
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
      dateFormat: document.getElementById('setting-date-format')?.value || 'system',
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

    const savedSettings = await api.invoke('update-settings', updates);
    showToast('Settings saved successfully');
    
    // Apply settings immediately
    if (typeof window.applySettings === 'function') {
      window.applySettings(savedSettings);
    }
    
    return savedSettings;
  } catch (error) {
    console.error('Failed to save settings:', error);
    showToast('Failed to save settings', 'error');
    throw error;
  }
}
