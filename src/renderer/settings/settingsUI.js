import { showToast } from '../utils/toast.js';
import { Modal } from '../utils/modal.js';

export async function showSettingsModal() {
  try {
    const settings = await window.api.invoke('get-settings');
    const modal = new Modal({
      title: 'Settings',
      content: document.createElement('div'),
      headerButtons: [
        {
          id: 'copy-settings-btn',
          className: 'secondary-btn',
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
          </svg>`,
          tooltip: 'Copy Settings',
          onClick: async (event) => {
            const button = event.currentTarget;
            try {
              const currentSettings = await window.api.invoke('get-settings');
              await window.api.invoke('copy-to-clipboard', JSON.stringify(currentSettings, null, 2));
              
              // Add copying class for animation
              button.classList.add('copying');
              
              // Remove class after animation completes
              setTimeout(() => {
                button.classList.remove('copying');
              }, 2000);
            } catch (error) {
              console.error('Failed to copy settings:', error);
              showToast('Failed to copy settings', 'error');
            }
          }
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          onClick: () => modal.close()
        },
        {
          text: 'Save Changes',
          primary: true,
          onClick: async () => {
            try {
              const updatedSettings = await saveSettings(settings, window.api);
              await window.api.invoke('update-settings', updatedSettings);
              modal.close();
            } catch (error) {
              console.error('Failed to save settings:', error);
            }
          }
        }
      ]
    });
    // Add settings-modal-open class to body
    document.body.classList.add('settings-modal-open');

    // Add cleanup on modal close
    const originalOnClose = modal.options.onClose;
    modal.options.onClose = () => {
      document.body.classList.remove('settings-modal-open');
      if (originalOnClose) originalOnClose();
    };

    modal.show();
    
    // Initialize settings UI in the modal
    setupSettingsUI(modal.element.querySelector('.modal-body'), settings, window.api);
  } catch (error) {
    console.error('Failed to show settings:', error);
    showToast('Failed to show settings', 'error');
  }
}

export async function setupSettingsUI(container, settings, api) {
  if (!container) return;

  container.innerHTML = `
    <div class="settings-layout">
      <div class="settings-sidebar">
        <div class="settings-nav">
          <button class="settings-nav-item active" data-section="ui">User Interface</button>
          <button class="settings-nav-item" data-section="editor">Editor</button>
          <button class="settings-nav-item" data-section="date">Date Format</button>
          <button class="settings-nav-item" data-section="advanced">Advanced</button>
        </div>
      </div>
      
      <div class="settings-content">
        <div class="settings-panel active" data-section="ui">
          <div class="settings-section">
            <h3>Theme</h3>
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
        </div>

        <div class="settings-panel" data-section="editor">
          <div class="settings-section">
            <h3>Behavior</h3>
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
        </div>

        <div class="settings-panel" data-section="date">
          <div class="settings-section">
            <h3>Date Format</h3>
            <div class="setting-item">
              <div style="flex: 1;">
                <label>Format:</label>
                <select id="setting-date-format">
                  <option value="system" ${settings?.dateFormat === 'system' ? 'selected' : ''}>System Default (Based on Locale)</option>
                  <option value="EU" ${settings?.dateFormat === 'EU' ? 'selected' : ''}>European (DD/MM/YYYY)</option>
                  <option value="EU-medium" ${settings?.dateFormat === 'EU-medium' ? 'selected' : ''}>European Medium (DD MMM YYYY)</option>
                  <option value="US" ${settings?.dateFormat === 'US' ? 'selected' : ''}>US (MM/DD/YYYY)</option>
                  <option value="ISO" ${settings?.dateFormat === 'ISO' ? 'selected' : ''}>ISO (YYYY-MM-DD)</option>
                  <option value="short" ${settings?.dateFormat === 'short' ? 'selected' : ''}>Short (MM/DD/YY)</option>
                  <option value="medium" ${settings?.dateFormat === 'medium' ? 'selected' : ''}>Medium (MMM DD, YYYY)</option>
                  <option value="long" ${settings?.dateFormat === 'long' ? 'selected' : ''}>Long (MMMM DD, YYYY)</option>
                  <option value="full" ${settings?.dateFormat === 'full' ? 'selected' : ''}>Full (dddd, MMMM DD, YYYY)</option>
                </select>
                <div id="date-format-preview" class="setting-preview"></div>
              </div>
            </div>
            <div class="setting-item">
              <p class="setting-description">
                Choose how dates are displayed throughout the application. Changes will apply to all dates including entry dates, deadlines, and timestamps.
              </p>
            </div>
          </div>
        </div>

        <div class="settings-panel" data-section="advanced">
          <div class="settings-section">
            <h3>Sync</h3>
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
        </div>
      </div>
    </div>
  `;

  // Setup event handlers
  setupSettingsEventHandlers(settings, api);
}

async function setupSettingsEventHandlers(settings, api) {
  // Settings navigation handlers
  const navItems = document.querySelectorAll('.settings-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove active class from all nav items and panels
      navItems.forEach(nav => nav.classList.remove('active'));
      document.querySelectorAll('.settings-panel').forEach(panel => panel.classList.remove('active'));
      
      // Add active class to clicked nav item and corresponding panel
      item.classList.add('active');
      const section = item.dataset.section;
      document.querySelector(`.settings-panel[data-section="${section}"]`).classList.add('active');
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

  // Date format preview handler
  const dateFormatSelect = document.getElementById('setting-date-format');
  const datePreview = document.getElementById('date-format-preview');
  
  if (dateFormatSelect && datePreview) {
    // Import formatDate once
    const { formatDate, updateDateFormatSettings } = await import('../utils/dateFormatter.js');
    
    // Function to update preview
    const updatePreview = () => {
      const today = new Date();
      const formattedDate = formatDate(today);
      datePreview.textContent = `Today: ${formattedDate}`;
    };

    // Update on format change
    dateFormatSelect.addEventListener('change', () => {
      updateDateFormatSettings({ ...settings, dateFormat: dateFormatSelect.value });
      updatePreview();
    });

    // Initial preview
    updatePreview();

    // Keep preview updated
    const previewInterval = setInterval(updatePreview, 1000);

    // Cleanup interval when modal closes
    const modalElement = dateFormatSelect.closest('.modal-container');
    if (modalElement) {
      const modal = modalElement.__modal_instance;
      if (modal) {
        const originalOnClose = modal.options.onClose;
        modal.options.onClose = () => {
          clearInterval(previewInterval);
          if (originalOnClose) originalOnClose();
        };
      }
    }
  }
}

export async function saveSettings(settings, api) {
  try {
    // Get all form values first
    const dateFormat = document.getElementById('setting-date-format')?.value;
    console.log('Selected date format:', dateFormat);

    const updates = {
      ...settings,
      autosave: document.getElementById('setting-autosave')?.checked ?? false,
      spellcheck: document.getElementById('setting-spellcheck')?.checked ?? true,
      theme: {
        name: document.getElementById('setting-theme')?.value || 'light',
        custom: settings.theme?.custom || {}
      },
      dateFormat: dateFormat || 'medium',
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

    console.log('Saving settings:', updates);
    await api.invoke('update-settings', updates);
    console.log('Settings saved successfully');
    
    // Update date format settings first
    const { updateDateFormatSettings } = await import('../utils/dateFormatter.js');
    updateDateFormatSettings(updates);

    // Apply settings to update any UI elements
    const { applySettings } = await import('./settings.js');
    applySettings(updates);

    // Force re-render of entries list to update dates with new format
    const entriesList = document.getElementById('entries-list');
    if (entriesList) {
      const { loadEntriesList } = await import('../entries/entryList.js');
      console.log('Re-rendering entries list with new date format');
      await loadEntriesList(api);
    }

    showToast('Settings saved successfully');
    return updates;
  } catch (error) {
    console.error('Failed to save settings:', error);
    showToast('Failed to save settings', 'error');
    throw error;
  }
}
