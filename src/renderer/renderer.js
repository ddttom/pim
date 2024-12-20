// Import styles
import { initializeStyles } from './styles/index.js';

// Global state and imported modules
let settings;
let editor;
let modules;

// Initialize application
async function initializeApp() {
  try {
    // Initialize styles first
    initializeStyles();

    // Import all modules
    modules = await importModules();

    // Initialize settings with defaults
    settings = modules.defaultSettings;

    // Load settings from main process
    const loadedSettings = await window.api.invoke('get-settings');
    if (loadedSettings) {
      settings = loadedSettings;
    }

    // Initialize editor (hidden by default)
    editor = modules.initializeEditor(settings);
    document.getElementById('editor-container')?.classList.add('hidden');

    // Apply settings
    modules.applySettings(settings, editor);

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
    { initializeEditor },
    { setupKeyboardShortcuts },
    { loadEntriesList, showEntriesList, setupSortListener, setupSearchListener, setupNavigationListener },
    { createNewEntry, loadEntry, saveEntry },
    { defaultSettings, applySettings },
    { showSettingsModal, closeSettingsModal, setupSettingsUI, saveSettings },
    { setupAutoSync }
  ] = await Promise.all([
    import('./utils/toast.js'),
    import('./editor/editor.js'),
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

  return {
    showToast,
    initializeEditor,
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
  document.getElementById('new-entry-btn')?.addEventListener('click', () => {
    document.getElementById('filters-btn')?.classList.add('hidden');
    handlers.createNewEntry();
  });
  
  document.getElementById('settings-btn')?.addEventListener('click', handlers.showSettingsModal);
  document.getElementById('save-btn')?.addEventListener('click', () => handlers.saveEntry(window.api));
  document.getElementById('copy-db-btn')?.addEventListener('click', async () => {
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
  
  document.getElementById('back-btn')?.addEventListener('click', () => {
    document.getElementById('editor-container')?.classList.add('hidden');
    document.getElementById('entries-container')?.classList.remove('hidden');
    document.getElementById('filters-btn')?.classList.remove('hidden');
  });

  // Add filters button functionality
  const filtersBtn = document.getElementById('filters-btn');
  const sidebar = document.querySelector('.sidebar');
  
  if (filtersBtn && sidebar) {
    filtersBtn.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
    });
  }

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
      handlers.applySettings(settings, editor);
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
    modules.applySettings(settings, editor);
    
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
