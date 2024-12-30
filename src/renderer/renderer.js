// Import styles and components
import { initializeStyles } from './styles/index.js';
import { Modal } from './utils/modal.js';
import { EditorModal } from './editor/EditorModal.js';

// Global state and cleanup
let settings;
let modules;
const cleanupFunctions = new Set();

// Import cleanup functions
import { cleanupAllToasts } from './utils/toast.js';
import { cleanup as cleanupEntryActions } from './entries/entryActions.js';

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

    // Setup event listeners and features with cleanup
    const eventCleanup = setupEventListeners(modules);
    if (eventCleanup) cleanupFunctions.add(eventCleanup);

    const shortcutsCleanup = modules.setupKeyboardShortcuts(settings, window.api);
    if (shortcutsCleanup) cleanupFunctions.add(shortcutsCleanup);

    const syncCleanup = modules.setupAutoSync(settings, window.api);
    if (syncCleanup) cleanupFunctions.add(syncCleanup);

    // Show entries list and setup listeners with cleanup
    document.getElementById('entries-container')?.classList.remove('hidden');
    await modules.loadEntriesList(window.api, (id) => modules.loadEntry(id, window.api));

    if (typeof modules.setupSearchListener === 'function') {
      const searchCleanup = modules.setupSearchListener(window.api, (id) => modules.loadEntry(id, window.api));
      if (searchCleanup) cleanupFunctions.add(searchCleanup);
    }

    if (typeof modules.setupNavigationListener === 'function') {
      const navCleanup = modules.setupNavigationListener(window.api, (id) => modules.loadEntry(id, window.api));
      if (navCleanup) cleanupFunctions.add(navCleanup);
    }

    if (typeof modules.setupSortListener === 'function') {
      const sortCleanup = modules.setupSortListener(window.api, (id) => modules.loadEntry(id, window.api));
      if (sortCleanup) cleanupFunctions.add(sortCleanup);
    }

    // Setup cleanup on window unload
    window.addEventListener('unload', cleanup);

  } catch (error) {
    console.error('Initialization failed:', error);
    if (modules?.showToast) {
      modules.showToast('Failed to initialize application', 'error');
    }
    cleanup();
  }
}

// Cleanup function to remove all event listeners and clear resources
function cleanup() {
  console.log('[App] Running cleanup');
  
  // Run all registered cleanup functions
  cleanupFunctions.forEach(cleanup => {
    try {
      cleanup();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });
  cleanupFunctions.clear();

  // Clean up toasts
  cleanupAllToasts();

  // Clean up entry actions
  cleanupEntryActions();

  // Reset state
  settings = null;
  modules = null;
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
  // Track event handlers for cleanup
  const eventHandlers = new Map();
  
  const addHandler = (element, event, handler) => {
    if (!element) return;
    element.addEventListener(event, handler);
    if (!eventHandlers.has(element)) {
      eventHandlers.set(element, new Map());
    }
    eventHandlers.get(element).set(event, handler);
  };

  // New Entry button handler
  const newEntryBtn = document.getElementById('new-entry-btn');
  addHandler(newEntryBtn, 'click', () => {
    handlers.createNewEntry(window.api);
  });

  // Copy DB button handler
  const copyDbBtn = document.getElementById('copy-db-btn');
  addHandler(copyDbBtn, 'click', async () => {
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

  // Filters button handler
  const filtersBtn = document.getElementById('filters-btn');
  addHandler(filtersBtn, 'click', () => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('hidden');
    }
  });

  // Settings button handler
  const settingsBtn = document.getElementById('settings-btn');
  addHandler(settingsBtn, 'click', async () => {
    const { setupSettingsUI } = await import('./settings/settingsUI.js');
    const { defaultSettings } = await import('./settings/settings.js');
    
    const currentSettings = await window.api.invoke('get-settings') || defaultSettings;
    console.log('[Settings] Opening settings modal');
    
    const modalContent = document.createElement('div');
    modalContent.className = 'settings-modal-content';
    
    const modal = new Modal({
      id: `settings-modal-${Date.now()}`,
      title: 'Settings',
      content: modalContent,
      width: '900px',
      height: '600px',
      className: 'settings-modal',
      onClose: () => {
        console.log('[Settings] Modal closing');
        if (cleanup) cleanup();
      }
    });

    // Initialize settings UI and get cleanup function
    let cleanup;
    modal.show();
    console.log('[Modal] Modal shown, initializing settings UI');
    
    // Wait for next frame to ensure modal is rendered
    requestAnimationFrame(async () => {
      cleanup = await setupSettingsUI(modalContent, currentSettings, window.api);
      console.log('[Modal] Settings UI initialized');
    });
  });

  // Back button handler
  const backBtn = document.getElementById('back-btn');
  addHandler(backBtn, 'click', () => {
    document.getElementById('entries-container')?.classList.remove('hidden');
    document.getElementById('filters-btn')?.classList.remove('hidden');
  });

  // Return cleanup function
  return () => {
    console.log('[App] Cleaning up event listeners');
    eventHandlers.forEach((handlers, element) => {
      handlers.forEach((handler, event) => {
        element.removeEventListener(event, handler);
      });
    });
    eventHandlers.clear();
  };
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
    // Clean up existing listeners
    cleanupFunctions.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });
    cleanupFunctions.clear();

    // Re-setup listeners with cleanup
    if (typeof modules.setupSearchListener === 'function') {
      const searchCleanup = modules.setupSearchListener(window.api, (id) => modules.loadEntry(id, window.api));
      if (searchCleanup) cleanupFunctions.add(searchCleanup);
    }

    if (typeof modules.setupNavigationListener === 'function') {
      const navCleanup = modules.setupNavigationListener(window.api, (id) => modules.loadEntry(id, window.api));
      if (navCleanup) cleanupFunctions.add(navCleanup);
    }

    if (typeof modules.setupSortListener === 'function') {
      const sortCleanup = modules.setupSortListener(window.api, (id) => modules.loadEntry(id, window.api));
      if (sortCleanup) cleanupFunctions.add(sortCleanup);
    }

    // Reload entries list
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
