// Import styles and components
import { initializeStyles } from './styles/index.js';
import { Modal } from './utils/modal.js';
import { EditorModal } from './editor/EditorModal.js';

// Global state and imported modules
let settings;
let modules;

// Initialize application
async function initializeApp() {
  try {
    // Add preload class to prevent transitions
    document.body.classList.add('preload');

    // Initialize styles first
    await initializeStyles();

    // Add ready class to sidebar and remove preload class
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.add('ready');
      // Remove preload class after a small delay to ensure styles are applied
      setTimeout(() => {
        document.body.classList.remove('preload');
      }, 100);
    }

    // Import all modules
    modules = await importModules();

    // Initialize settings with defaults
    settings = modules.defaultSettings;

    // Load settings from main process
    const loadedSettings = await window.api.invoke('get-settings');
    if (loadedSettings) {
      settings = loadedSettings;
    }

    // Ensure parser test modal is hidden
    const parserModal = document.getElementById('parser-test-modal');
    if (parserModal) {
      parserModal.classList.remove('show');
      document.body.classList.remove('modal-open');
    }

    // Apply settings
    modules.applySettings(settings);

    // Setup event listeners and features
    setupEventListeners(modules);
    modules.setupKeyboardShortcuts(settings, window.api);
    modules.setupAutoSync(settings, window.api);

    // Show entries list and setup listeners
    document.getElementById('entries-container')?.classList.remove('hidden');
    await modules.loadEntriesList(window.api, (id) => modules.loadEntry(id, window.api));
    if (typeof modules.setupSearchListener === 'function') {
      modules.setupSearchListener(window.api, (id) => modules.loadEntry(id, window.api));
    }
    if (typeof modules.setupNavigationListener === 'function') {
      modules.setupNavigationListener(window.api, (id) => modules.loadEntry(id, window.api));
    }
    if (typeof modules.setupSortListener === 'function') {
      modules.setupSortListener(window.api, (id) => modules.loadEntry(id, window.api));
    }
  } catch (error) {
    console.error('Initialization failed:', error);
    if (modules?.showToast) {
      modules.showToast('Failed to initialize application', 'error');
    }
  }
}

async function importModules() {
  const [
    { showToast },
    { setupKeyboardShortcuts },
    { loadEntriesList, showEntriesList, setupSortListener, setupSearchListener, setupNavigationListener },
    { createNewEntry, loadEntry, saveEntry },
    { defaultSettings, applySettings },
    { showSettingsModal, closeSettingsModal, setupSettingsUI, saveSettings },
    { setupAutoSync }
  ] = await Promise.all([
    import('./utils/toast.js'),
    import('./editor/shortcuts.js'),
    import('./entries/entryList.js'),
    import('./entries/entryActions.js'),
    import('./settings/settings.js'),
    import('./settings/settingsUI.js'),
    import('./sync/sync.js')
  ]);

  // Make settings and functions available to HTML
  window.settings = settings;
  window.closeSettingsModal = closeSettingsModal;
  window.saveSettings = () => saveSettings(settings, window.api);
  window.applySettings = (newSettings) => {
    settings = newSettings;
    modules.applySettings(newSettings);
  };

  return {
    showToast,
    setupKeyboardShortcuts,
    loadEntriesList,
    showEntriesList,
    setupSortListener,
    setupSearchListener,
    setupNavigationListener,
    createNewEntry,
    loadEntry,
    saveEntry,
    defaultSettings,
    applySettings,
    showSettingsModal,
    closeSettingsModal,
    setupSettingsUI,
    saveSettings,
    setupAutoSync
  };
}

function setupEventListeners(handlers) {
  // Clear existing event listeners first
  ['new-entry-btn', 'save-btn', 'settings-btn', 'back-btn', 'filters-btn', 'copy-db-btn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
    }
  });

  // Re-add event listeners
  const newEntryBtn = document.getElementById('new-entry-btn');
  const copyDbBtn = document.getElementById('copy-db-btn');
  const filtersBtn = document.getElementById('filters-btn');

  if (newEntryBtn) {
    newEntryBtn.addEventListener('click', () => {
      handlers.createNewEntry(window.api);
    });
  }

  if (copyDbBtn) {
    copyDbBtn.addEventListener('click', async () => {
      try {
        const entries = await window.api.invoke('get-entries');
        const success = await window.api.invoke('copy-to-clipboard', JSON.stringify(entries, null, 2));
        if (success) {
          handlers.showToast('Database copied to clipboard', 'success');
        } else {
          handlers.showToast('Failed to copy database', 'error');
        }
      } catch (error) {
        console.error('Copy DB error:', error);
        handlers.showToast('Failed to copy database', 'error');
      }
    });
  }

  if (filtersBtn) {
    filtersBtn.addEventListener('click', () => {
      Modal.closeAll(); // Close any open modals first
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.classList.toggle('hidden');
      }
    });
  }

  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', async () => {
      const buttonRect = settingsBtn.getBoundingClientRect();
      const modalWidth = 800; // Width of the modal
      
      const modal = new Modal({
        title: 'Settings',
        titleExtra: `
          <button id="copy-settings-btn" class="header-btn" title="Copy settings to clipboard">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
            </svg>
          </button>
        `,
        content: document.createElement('div'),
        width: modalWidth + 'px',
        position: {
          top: buttonRect.bottom + 'px',
          right: (window.innerWidth - buttonRect.right) + 'px'
        },
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
                const updatedSettings = await handlers.saveSettings(settings, window.api);
                await window.api.invoke('update-settings', updatedSettings);
                modal.close();
              } catch (error) {
                console.error('Failed to save settings:', error);
                handlers.showToast('Failed to save settings', 'error');
              }
            }
          }
        ]
      });
      modal.show();

      // Add copy settings button handler
      const copySettingsBtn = modal.element.querySelector('#copy-settings-btn');
      if (copySettingsBtn) {
        copySettingsBtn.addEventListener('click', async () => {
          try {
            const currentSettings = await window.api.invoke('get-settings');
            await window.api.invoke('copy-to-clipboard', JSON.stringify(currentSettings, null, 2));
            handlers.showToast('Settings copied to clipboard');
          } catch (error) {
            console.error('Failed to copy settings:', error);
            handlers.showToast('Failed to copy settings', 'error');
          }
        });
      }

      // Update data path display
      const dataPath = await window.api.invoke('get-data-path');
      const dataPathElement = modal.element.querySelector('.current-path');
      if (dataPathElement) {
        dataPathElement.textContent = `Current path: ${dataPath}`;
      }
      
      // Initialize settings UI in the modal
      handlers.setupSettingsUI(modal.element.querySelector('.modal-body'), settings, window.api);
    });
  }
  
  document.getElementById('back-btn')?.addEventListener('click', () => {
    // Show entries container and filters
    document.getElementById('entries-container')?.classList.remove('hidden');
    document.getElementById('filters-btn')?.classList.remove('hidden');
  });


  // Settings modal handlers
  const settingsModal = document.getElementById('settings-modal');
  const closeBtn = settingsModal?.querySelector('.close-btn');
  const cancelBtn = settingsModal?.querySelector('.modal-footer .secondary-btn');
  const saveBtn = settingsModal?.querySelector('.modal-footer .primary-btn');

  closeBtn?.addEventListener('click', handlers.closeSettingsModal);
  cancelBtn?.addEventListener('click', handlers.closeSettingsModal);
  
  saveBtn?.addEventListener('click', async () => {
    try {
      settings = await handlers.saveSettings(settings, window.api);
      handlers.applySettings(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      handlers.showToast('Failed to save settings', 'error');
    }
  });
}

// Update settings loaded event listener
window.api.on('settings-loaded', (loadedSettings) => {
  if (loadedSettings && modules) {
    settings = loadedSettings;
    window.settings = loadedSettings;
    modules.applySettings(settings);
    
    // Initialize settings UI if modal is visible
    const modal = document.getElementById('settings-modal');
    if (modal?.classList.contains('visible')) {
      modules.setupSettingsUI(settings, window.api);
    }
  }
});

// Listen for entries changes
window.api.on('entries-changed', async () => {
  try {
    await modules.loadEntriesList(window.api, (id) => modules.loadEntry(id, window.api));
  } catch (error) {
    console.error('Failed to reload entries:', error);
    if (modules?.showToast) {
      modules.showToast('Failed to reload entries', 'error');
    }
  }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
