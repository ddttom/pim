import { showToast } from '../utils/toast.js';
import modalStateManager from '../utils/modalStateManager.js';

export async function setupSettingsUI(container, settings, api) {
  if (!container) return;

  const modalId = `settings-modal-${Date.now()}`;
  console.log('[Settings] Setting up UI with modal ID:', modalId);

  // Register with state manager
  modalStateManager.registerModal(modalId, {
    type: 'settings',
    hasSecondaryModal: false
  });

  container.innerHTML = `
    <div class="settings-ribbon">
      <div class="ribbon-section">
        <button id="copy-settings-btn" class="ribbon-btn secondary-btn">
          <span class="btn-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
            </svg>
          </span>
          <span class="btn-label">Copy Settings</span>
        </button>
      </div>
    </div>
    <div class="settings-container">
      <div class="settings-sidebar">
        <ul class="settings-nav">
          <li><a href="#interface" class="active">User Interface</a></li>
          <li><a href="#editor">Editor</a></li>
          <li><a href="#advanced">Advanced</a></li>
        </ul>
      </div>

      <div class="settings-content">
        <div id="interface" class="settings-section active">
          <h3>User Interface</h3>
          <div class="setting-item">
            <label>Theme:</label>
            <select id="setting-theme">
              <option value="light" ${settings?.theme?.name === 'light' ? 'selected' : ''}>Light</option>
              <option value="dark" ${settings?.theme?.name === 'dark' ? 'selected' : ''}>Dark</option>
              <option value="system" ${settings?.theme?.name === 'system' ? 'selected' : ''}>System</option>
            </select>
          </div>
          <div class="setting-item">
            <label>Date format:</label>
            <select id="setting-date-format">
              <option value="system" ${settings?.dateFormat === 'system' ? 'selected' : ''}>System Default</option>
              <option value="us-short" ${settings?.dateFormat === 'us-short' ? 'selected' : ''}>US Short (MM/DD/YY)</option>
              <option value="us-medium" ${settings?.dateFormat === 'us-medium' ? 'selected' : ''}>US Medium (MMM DD, YYYY)</option>
              <option value="us-long" ${settings?.dateFormat === 'us-long' ? 'selected' : ''}>US Long (MMMM DD, YYYY)</option>
              <option value="eu-short" ${settings?.dateFormat === 'eu-short' ? 'selected' : ''}>EU Short (DD/MM/YY)</option>
              <option value="eu-medium" ${settings?.dateFormat === 'eu-medium' ? 'selected' : ''}>EU Medium (DD MMM YYYY)</option>
              <option value="eu-long" ${settings?.dateFormat === 'eu-long' ? 'selected' : ''}>EU Long (DD MMMM YYYY)</option>
              <option value="iso" ${settings?.dateFormat === 'iso' ? 'selected' : ''}>ISO 8601 (YYYY-MM-DD)</option>
              <option value="jp" ${settings?.dateFormat === 'jp' ? 'selected' : ''}>Japanese (YYYY年MM月DD日)</option>
            </select>
            <span class="setting-hint"></span>
          </div>
        </div>

        <div id="editor" class="settings-section">
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
            <label>Font Size:</label>
            <input type="range" id="setting-font-size" min="12" max="24" 
              value="${parseInt(settings?.advanced?.fontSize || '16')}">
            <span id="font-size-value">${settings?.advanced?.fontSize || '16px'}</span>
          </div>
        </div>

        <div id="advanced" class="settings-section">
          <h3>Advanced</h3>
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
          <div class="setting-item backup-controls">
            <button id="backup-btn" class="secondary-btn">Create Backup</button>
            <button id="restore-btn" class="secondary-btn">Restore Backup</button>
          </div>
        </div>

        <div class="settings-footer">
          <button id="cancel-settings-btn" class="secondary-btn">Cancel</button>
          <button id="save-settings-btn" class="primary-btn">Save</button>
        </div>
      </div>
    </div>
  `;

  // Setup event handlers with cleanup tracking
  const eventHandlers = new Map();
  const addHandler = (element, event, handler) => {
    element.addEventListener(event, handler);
    if (!eventHandlers.has(element)) {
      eventHandlers.set(element, new Map());
    }
    eventHandlers.get(element).set(event, handler);
  };

  // Navigation handlers
  const navLinks = document.querySelectorAll('.settings-nav a');
  navLinks.forEach(link => {
    const navHandler = (e) => {
      e.preventDefault();
      
      // Update active state
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Show corresponding section
      const sectionId = link.getAttribute('href').substring(1);
      document.querySelectorAll('.settings-section').forEach(section => {
        section.classList.remove('active');
      });
      document.getElementById(sectionId)?.classList.add('active');
    };
    addHandler(link, 'click', navHandler);
  });

  // Copy settings button handler
  const copySettingsBtn = document.getElementById('copy-settings-btn');
  if (copySettingsBtn) {
    const copyHandler = async () => {
      try {
        const currentSettings = getCurrentSettings(settings);
        await api.invoke('copy-to-clipboard', JSON.stringify(currentSettings, null, 2));
        
        console.log('[Settings] Copy button clicked');
        
        const btnLabel = copySettingsBtn.querySelector('.btn-label');
        btnLabel.textContent = 'Copied';
        copySettingsBtn.classList.add('button-success');
        showToast('Settings copied to clipboard');
        
        setTimeout(() => {
          copySettingsBtn.classList.remove('button-success');
          btnLabel.textContent = 'Copy Settings';
        }, 2000);
      } catch (error) {
        console.error('Failed to copy settings:', error);
        showToast('Failed to copy settings', 'error');
      }
    };
    addHandler(copySettingsBtn, 'click', copyHandler);
  }

  // Footer button handlers
  const cancelBtn = document.getElementById('cancel-settings-btn');
  const saveBtn = document.getElementById('save-settings-btn');
  
  if (cancelBtn) {
    const cancelHandler = () => {
      const modal = cancelBtn.closest('.modal');
      if (modal) {
        modal.dispatchEvent(new Event('click'));
      }
    };
    addHandler(cancelBtn, 'click', cancelHandler);
  }

  if (saveBtn) {
    const saveHandler = async () => {
      try {
        const currentSettings = getCurrentSettings(settings);
        await api.invoke('update-settings', currentSettings);
        
        console.log('[Settings] Save button clicked');
        
        saveBtn.textContent = 'Saved';
        saveBtn.classList.add('button-success');
        showToast('Settings saved successfully');
        
        setTimeout(() => {
          saveBtn.classList.remove('button-success');
          saveBtn.textContent = 'Save';
          
          const modal = saveBtn.closest('.modal');
          if (modal) {
            modal.dispatchEvent(new Event('click'));
          }
        }, 2000);
      } catch (error) {
        console.error('Failed to save settings:', error);
        showToast('Failed to save settings', 'error');
      }
    };
    addHandler(saveBtn, 'click', saveHandler);
  }

  // Sync settings handlers
  const syncEnabled = document.getElementById('setting-sync-enabled');
  if (syncEnabled) {
    const syncHandler = (e) => {
      const enabled = e.target.checked;
      document.getElementById('setting-sync-provider').disabled = !enabled;
      document.getElementById('setting-autosync').disabled = !enabled;
      
      if (!enabled) {
        document.getElementById('setting-sync-interval').disabled = true;
        document.getElementById('setting-autosync').checked = false;
      }
    };
    addHandler(syncEnabled, 'change', syncHandler);
  }

  // Auto sync handler
  const autoSync = document.getElementById('setting-autosync');
  if (autoSync) {
    const autoSyncHandler = (e) => {
      document.getElementById('setting-sync-interval').disabled = !e.target.checked;
    };
    addHandler(autoSync, 'change', autoSyncHandler);
  }

  // Font size range handler
  const fontSizeInput = document.getElementById('setting-font-size');
  const fontSizeValue = document.getElementById('font-size-value');
  if (fontSizeInput && fontSizeValue) {
    const fontSizeHandler = (e) => {
      fontSizeValue.textContent = `${e.target.value}px`;
    };
    addHandler(fontSizeInput, 'input', fontSizeHandler);
  }

  // Date format preview handler
  const dateFormatSelect = document.getElementById('setting-date-format');
  const dateFormatHint = dateFormatSelect?.nextElementSibling;
  if (dateFormatSelect && dateFormatHint) {
    // Import formatDate function
    import('../utils/dateFormatter.js').then(({ formatDate }) => {
      // Function to update preview
      const updatePreview = () => {
        const now = new Date();
        const preview = formatDate(now, dateFormatSelect.value);
        dateFormatHint.textContent = preview;
      };

      // Update preview and refresh views on change
      const dateFormatHandler = async () => {
        updatePreview();
        
        // Save settings and refresh views
        const currentSettings = getCurrentSettings(settings);
        await api.invoke('update-settings', currentSettings);
        const { loadEntriesList } = await import('../entries/entryList.js');
        await loadEntriesList(api, async (id) => {
          const { loadEntry } = await import('../entries/entryActions.js');
          return loadEntry(id, api);
        });
      };
      addHandler(dateFormatSelect, 'change', dateFormatHandler);

      // Show initial preview
      updatePreview();
    });
  }

  // Cleanup function
  const cleanup = () => {
    console.log('[Settings] Cleaning up resources');
    
    // Remove event listeners
    eventHandlers.forEach((handlers, element) => {
      handlers.forEach((handler, event) => {
        element.removeEventListener(event, handler);
      });
    });
    eventHandlers.clear();

    // Unregister from state manager
    modalStateManager.unregisterModal(modalId);
  };

  // Return cleanup function
  return cleanup;
}

function getCurrentSettings(settings) {
  return {
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
}
