const { ipcRenderer } = require('electron');
const Quill = require('quill');
const Turndown = require('turndown');
const turndown = new Turndown();

let editor;
let currentEntryId = null;
let currentFilters = {
  search: '',
  status: new Set(['pending']),
  priority: new Set(['normal']),
  sort: 'date-desc'
};

// Initialize with default settings until loaded from main process
let settings = {
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

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize editor first
    initializeEditor();

    // Apply initial settings
    applySettings(settings);

    // Setup event listeners
    setupEventListeners();

    // Then load settings from main process
    const loadedSettings = await ipcRenderer.invoke('get-settings');
    if (loadedSettings) {
      settings = loadedSettings;
      applySettings(settings);
    }

    // Finally load entries
    await loadEntriesList();
    showEntriesList();
  } catch (error) {
    console.error('Initialization failed:', error);
    showToast('Failed to initialize application', 'error');
  }
});

// Update settings loaded event listener
ipcRenderer.on('settings-loaded', (_, loadedSettings) => {
  if (loadedSettings) {
    settings = loadedSettings;
    applySettings(settings);
    setupSettingsUI(); // Refresh settings UI with new values
  }
});

function applySettings(settings) {
  if (!settings) return;

  try {
    // Apply theme with fallback
    document.body.className = settings?.theme?.name || 'light';
    
    // Apply advanced settings with fallbacks
    const advanced = settings?.advanced || {};
    document.documentElement.style.setProperty('--font-size', advanced.fontSize || '16px');
    document.documentElement.style.setProperty('--font-family', advanced.fontFamily || 'system-ui');
    document.documentElement.style.setProperty('--border-radius', advanced.borderRadius || '4px');
    
    // Apply editor settings if editor exists
    if (editor?.root) {
      editor.root.spellcheck = settings?.spellcheck ?? true;
    }
    
    // Apply custom CSS if any
    if (advanced?.customCSS) {
      const customStyle = document.getElementById('custom-style') || document.createElement('style');
      customStyle.id = 'custom-style';
      customStyle.textContent = advanced.customCSS;
      document.head.appendChild(customStyle);
    }

    // Apply sidebar state if specified in settings
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = sidebar?.querySelector('.sidebar-toggle');
    if (sidebar && sidebarToggle && advanced?.sidebarCollapsed !== undefined) {
      sidebar.classList.toggle('collapsed', advanced.sidebarCollapsed);
    }
  } catch (error) {
    console.error('Failed to apply settings:', error);
  }
}

function initializeEditor() {
  try {
    editor = new Quill('#editor', {
      theme: 'snow',
      modules: {
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['link', 'blockquote', 'code-block'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['clean']
        ]
      }
    });

    // Apply initial editor settings
    if (settings) {
      editor.root.spellcheck = settings.spellcheck;
    }
  } catch (error) {
    console.error('Failed to initialize editor:', error);
    throw error;
  }
}

let filtersVisible = true;

function toggleFilters() {
  const filters = document.querySelector('.filters');
  filtersVisible = !filtersVisible;
  filters.style.display = filtersVisible ? 'block' : 'none';
  document.getElementById('filter-btn').classList.toggle('active', filtersVisible);
}

function toggleSortMenu() {
  const sortBtn = document.getElementById('sort-btn');
  const dropdown = document.getElementById('sort-dropdown');
  
  // Close any other open dropdowns first
  document.querySelectorAll('.dropdown-content').forEach(d => {
    if (d !== dropdown) d.style.display = 'none';
  });
  document.querySelectorAll('.ribbon-btn').forEach(b => {
    if (b !== sortBtn) b.classList.remove('active');
  });
  
  // Toggle current dropdown
  const isVisible = dropdown.style.display === 'block';
  dropdown.style.display = isVisible ? 'none' : 'block';
  sortBtn.classList.toggle('active', !isVisible);
}

function setupEventListeners() {
  // Clear existing event listeners first
  const buttons = ['new-entry-btn', 'save-btn', 'settings-btn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
    }
  });

  // Re-add event listeners
  const newEntryBtn = document.getElementById('new-entry-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const saveBtn = document.getElementById('save-btn');
  const filterBtn = document.getElementById('filter-btn');
  const sortBtn = document.getElementById('sort-btn');

  if (newEntryBtn) {
    newEntryBtn.addEventListener('click', createNewEntry);
  }
  
  if (settingsBtn) {
    settingsBtn.addEventListener('click', showSettingsModal);
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', saveEntry);
  }

  if (filterBtn) {
    filterBtn.addEventListener('click', toggleFilters);
  }

  if (sortBtn) {
    sortBtn.addEventListener('click', toggleSortMenu);
  }

  // Add sidebar toggle with triangle icon
  const sidebarToggle = document.createElement('button');
  sidebarToggle.className = 'sidebar-toggle';
  sidebarToggle.title = 'Toggle Sidebar';
  sidebarToggle.textContent = '←'; // Initial state (collapse)
  
  const sidebar = document.querySelector('.sidebar');
  const sidebarHeader = document.querySelector('.sidebar-header');
  
  if (sidebar && sidebarHeader) {
    sidebarHeader.appendChild(sidebarToggle);

    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      // Update arrow direction
      sidebarToggle.textContent = sidebar.classList.contains('collapsed') ? '→' : '←';
      
      const isCollapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('sidebarCollapsed', isCollapsed);
      
      if (settings?.advanced) {
        settings.advanced.sidebarCollapsed = isCollapsed;
      }
    });

    // Restore sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
      sidebar.classList.add('collapsed');
      sidebarToggle.textContent = '→';
    }
  }

  // Add back button handler
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      const editorContainer = document.getElementById('editor-container');
      if (editorContainer) {
        editorContainer.classList.add('hidden');
      }
      showEntriesList();
    });
  }
}

async function loadEntriesList() {
  try {
    const entriesList = document.getElementById('entries-list');
    if (!entriesList) {
      console.error('Entries list element not found');
      return;
    }

    const entries = await ipcRenderer.invoke('get-entries');
    const filteredEntries = filterEntries(entries);
    const sortedEntries = sortEntries(filteredEntries);
    
    renderEntries(sortedEntries);
  } catch (error) {
    console.error('Failed to load entries:', error);
    showToast('Failed to load entries', 'error');
  }
}

function filterEntries(entries) {
  return entries.filter(entry => {
    // Search filter
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      const content = entry.content.raw.toLowerCase();
      if (!content.includes(searchTerm)) return false;
    }

    // Status filter
    if (currentFilters.status.size > 0) {
      if (!currentFilters.status.has(entry.parsed.status)) return false;
    }

    // Priority filter
    if (currentFilters.priority.size > 0) {
      if (!currentFilters.priority.has(entry.parsed.priority)) return false;
    }

    return true;
  });
}

function sortEntries(entries) {
  return entries.sort((a, b) => {
    switch (currentFilters.sort) {
      case 'date-desc':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'date-asc':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'priority':
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.parsed.priority] - priorityOrder[a.parsed.priority];
      case 'deadline':
        if (!a.parsed.final_deadline) return 1;
        if (!b.parsed.final_deadline) return -1;
        return new Date(a.parsed.final_deadline) - new Date(b.parsed.final_deadline);
      default:
        return 0;
    }
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function renderEntries(entries) {
  const entriesList = document.getElementById('entries-list');
  if (!entriesList) return;

  try {
    entriesList.innerHTML = entries.map(entry => `
      <div class="entry-item" data-id="${entry.id}">
        <div class="entry-header">
          <h3>${entry.title || 'Untitled'}</h3>
          <span class="entry-date">${formatDate(entry.created_at)}</span>
        </div>
        <div class="entry-preview">${entry.preview || ''}</div>
      </div>
    `).join('');

    // Add click handlers to entries
    entriesList.querySelectorAll('.entry-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        if (id) loadEntry(id);
      });
    });
  } catch (error) {
    console.error('Failed to render entries:', error);
    showToast('Failed to display entries', 'error');
  }
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Failed to format date:', error);
    return dateString;
  }
}

function formatPreview(entry) {
  let preview = '';
  
  if (entry.parsed.final_deadline) {
    preview += `<span class="deadline">Due: ${formatDate(entry.parsed.final_deadline)}</span>`;
  }
  
  if (entry.parsed.priority) {
    preview += `<span class="priority ${entry.parsed.priority}">Priority: ${entry.parsed.priority}</span>`;
  }
  
  if (entry.parsed.participants?.length) {
    preview += `<span class="participants">With: ${entry.parsed.participants.join(', ')}</span>`;
  }
  
  return preview;
}

function createNewEntry() {
  currentEntryId = null;
  editor.root.innerHTML = '';
  showEditor();
}

async function loadEntry(id) {
  try {
    currentEntryId = id;
    const entries = await ipcRenderer.invoke('get-entries', { id });
    const entry = entries.find(e => e.id === id);
    if (!entry) throw new Error('Entry not found');
    
    editor.root.innerHTML = entry.content.markdown;
    showEditor();
  } catch (error) {
    console.error('Failed to load entry:', error);
    alert('Failed to load entry');
  }
}

async function deleteEntry(id) {
  if (confirm('Are you sure you want to delete this entry?')) {
    await ipcRenderer.invoke('delete-entry', id);
    await loadEntriesList();
  }
}

async function saveEntry() {
  try {
    const content = {
      raw: editor.getText() || '',
      html: editor.root.innerHTML
    };

    if (currentEntryId) {
      await ipcRenderer.invoke('update-entry', currentEntryId, content);
    } else {
      currentEntryId = await ipcRenderer.invoke('add-entry', content);
    }

    showToast('Entry saved successfully');
    await loadEntriesList();
  } catch (error) {
    console.error('Failed to save entry:', error);
    showToast('Failed to save entry: ' + error.message, 'error');
  }
}

async function handleImageUpload(event) {
  const files = event.target.files;
  if (!files.length || !currentEntryId) return;

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const imageInfo = await ipcRenderer.invoke('add-image', currentEntryId, buffer, file.name);
    
    // Insert image into editor
    const range = editor.getSelection(true);
    editor.insertEmbed(range.index, 'image', imageInfo.path);
  }
}

async function loadEntries() {
  const entries = await ipcRenderer.invoke('get-entries');
  const entriesList = document.getElementById('entries-list');
  entriesList.innerHTML = '';

  entries.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'entry';
    div.innerHTML = `
      <h3>${entry.content.raw.substring(0, 50)}...</h3>
      <div class="entry-content">${entry.content.markdown}</div>
      <div class="entry-images">
        ${entry.content.images.map(img => `<img src="${img}" alt="Entry image">`).join('')}
      </div>
    `;
    div.addEventListener('click', () => loadEntry(entry));
    entriesList.appendChild(div);
  });
}

function showEntriesList() {
  const editorContainer = document.getElementById('editor-container');
  const entriesList = document.getElementById('entries-list');
  
  if (editorContainer) {
    editorContainer.classList.add('hidden');
  }
  
  if (entriesList) {
    entriesList.parentElement.classList.remove('hidden');
  }
  
  // Clear current entry
  currentEntryId = null;
  
  // Clear editor content
  if (editor) {
    editor.setContents([]);
  }
}

function showEditor() {
  document.getElementById('editor-container').classList.remove('hidden');
  document.getElementById('save-btn').classList.remove('hidden');
  document.querySelector('.sidebar').classList.add('hidden');
}

async function showSettingsModal() {
  try {
    const modal = document.getElementById('settings-modal');
    if (!modal) {
      console.error('Settings modal not found');
      return;
    }

    // Setup UI before showing modal
    await setupSettingsUI();

    // Show modal
    modal.style.display = 'flex';
    modal.classList.add('visible');
  } catch (error) {
    console.error('Failed to show settings modal:', error);
    showToast('Failed to open settings', 'error');
  }
}

// Update closeSettingsModal function
function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.classList.remove('visible');
    // Wait for animation to finish
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
}

// Add function to create settings modal
function createSettingsModal() {
  const modal = document.createElement('div');
  modal.id = 'settings-modal';
  modal.className = 'modal hidden';
  
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-container">
      <div class="modal-header">
        <h2>Settings</h2>
        <button class="close-btn" onclick="closeSettingsModal()">&times;</button>
      </div>
      <div class="modal-body">
        <!-- Settings content will be inserted here -->
      </div>
      <div class="modal-footer">
        <button class="primary-btn" onclick="saveSettings()">Save</button>
        <button class="secondary-btn" onclick="closeSettingsModal()">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  
  // Add click handler to close on overlay click
  modal.querySelector('.modal-overlay').addEventListener('click', closeSettingsModal);
  
  return modal;
}

// Add function to save settings
async function saveSettings() {
  try {
    const updates = {
      ...settings, // Keep existing settings as base
      autosave: document.getElementById('setting-autosave')?.checked ?? false,
      spellcheck: document.getElementById('setting-spellcheck')?.checked ?? true,
      theme: {
        name: document.getElementById('setting-theme')?.value || 'light',
        custom: settings.theme?.custom || {
          primary: '#3498db',
          secondary: '#95a5a6',
          background: '#f5f5f5',
          text: '#333333',
          accent: '#2ecc71'
        }
      },
      dateFormat: document.getElementById('setting-date-format')?.value || 'medium',
      advanced: {
        fontSize: `${document.getElementById('setting-font-size')?.value || 16}px`,
        fontFamily: document.getElementById('setting-font-family')?.value || 'system-ui',
        borderRadius: `${document.getElementById('setting-border-radius')?.value || 4}px`,
        spacing: document.getElementById('setting-spacing')?.value || 'comfortable',
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

    // Save settings to main process
    await ipcRenderer.invoke('update-settings', updates);
    settings = updates; // Update local settings
    applySettings(settings);
    closeSettingsModal();
    showToast('Settings saved successfully');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showToast('Failed to save settings', 'error');
  }
}

function setupAutoBackup() {
  const intervals = {
    hourly: 60 * 60 * 1000,
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000
  };

  const interval = intervals[settings.autoBackup.interval];
  setInterval(async () => {
    if (settings.notifications) {
      showToast('Creating automatic backup...', 'info');
    }
    await createBackup();
  }, interval);
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Show toast
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Hide and remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

async function createBackup() {
  try {
    await ipcRenderer.invoke('create-backup');
    showToast('Backup created successfully');
  } catch (error) {
    showToast('Failed to create backup', 'error');
  }
}

async function restoreBackup() {
  try {
    const result = await ipcRenderer.invoke('restore-backup');
    if (result) {
      await loadEntriesList();
      showToast('Backup restored successfully');
    }
  } catch (error) {
    showToast('Failed to restore backup', 'error');
  }
}

function handleEscape() {
  if (!document.getElementById('settings-modal').classList.contains('hidden')) {
    closeSettingsModal();
  } else if (!document.getElementById('editor-container').classList.contains('hidden')) {
    showEntriesList();
  }
}

function focusSearch() {
  document.getElementById('search-input').focus();
}

// Add settings import/export buttons to settings modal
document.querySelector('.settings-section:last-child').innerHTML += `
  <div class="setting-item">
    <button id="export-settings" class="secondary-btn">Export Settings</button>
    <button id="import-settings" class="secondary-btn">Import Settings</button>
    <input type="file" id="settings-file" accept=".json" style="display: none">
  </div>
`;

// Add settings import/export handlers
document.getElementById('export-settings').addEventListener('click', exportSettings);
document.getElementById('import-settings').addEventListener('click', () => {
  document.getElementById('settings-file').click();
});
document.getElementById('settings-file').addEventListener('change', importSettings);

async function exportSettings() {
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

async function importSettings(event) {
  try {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedSettings = JSON.parse(e.target.result);
        await ipcRenderer.invoke('update-settings', importedSettings);
        settings = importedSettings;
        applySettings();
        showToast('Settings imported successfully');
        event.target.value = ''; // Reset file input
      } catch (error) {
        showToast('Invalid settings file', 'error');
      }
    };
    reader.readAsText(file);
  } catch (error) {
    showToast('Failed to import settings', 'error');
  }
}

// Add theme customization
const themePresets = {
  light: {
    primary: '#3498db',
    secondary: '#95a5a6',
    background: '#f5f5f5',
    text: '#333333',
    accent: '#2ecc71'
  },
  dark: {
    primary: '#3498db',
    secondary: '#95a5a6',
    background: '#1a1a1a',
    text: '#ffffff',
    accent: '#2ecc71'
  },
  sepia: {
    primary: '#704214',
    secondary: '#8b7355',
    background: '#f4ecd8',
    text: '#463020',
    accent: '#917147'
  },
  nord: {
    primary: '#88C0D0',
    secondary: '#81A1C1',
    background: '#2E3440',
    text: '#ECEFF4',
    accent: '#A3BE8C'
  },
  solarized: {
    primary: '#268BD2',
    secondary: '#93A1A1',
    background: '#FDF6E3',
    text: '#657B83',
    accent: '#2AA198'
  },
  dracula: {
    primary: '#BD93F9',
    secondary: '#6272A4',
    background: '#282A36',
    text: '#F8F8F2',
    accent: '#50FA7B'
  },
  monokai: {
    primary: '#F92672',
    secondary: '#75715E',
    background: '#272822',
    text: '#F8F8F2',
    accent: '#A6E22E'
  }
};

// Add theme preset selector to settings
document.querySelector('.settings-section:nth-child(2)').innerHTML += `
  <div class="setting-item">
    <label>Theme Preset:</label>
    <select id="theme-preset">
      <option value="custom">Custom</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="sepia">Sepia</option>
      <option value="nord">Nord</option>
      <option value="solarized">Solarized</option>
      <option value="dracula">Dracula</option>
      <option value="monokai">Monokai</option>
    </select>
  </div>
`;

document.getElementById('theme-preset').addEventListener('change', (e) => {
  const preset = themePresets[e.target.value];
  if (preset) {
    Object.entries(preset).forEach(([key, value]) => {
      document.getElementById(`setting-${key}-color`).value = value;
    });
  }
});

// Add keyboard shortcut customization to settings modal
document.querySelector('.settings-section:nth-child(1)').innerHTML += `
  <div class="setting-item">
    <h4>Keyboard Shortcuts</h4>
    <div class="shortcuts-list">
      ${Object.entries(settings.shortcuts.custom).map(([action, shortcut]) => `
        <div class="shortcut-item">
          <label>${formatActionName(action)}:</label>
          <input type="text" 
                 class="shortcut-input" 
                 data-action="${action}" 
                 value="${shortcut}"
                 readonly>
          <button class="record-shortcut-btn">Record</button>
        </div>
      `).join('')}
    </div>
  </div>
`;

function formatActionName(action) {
  return action
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

// Handle shortcut recording
document.querySelectorAll('.record-shortcut-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const input = this.previousElementSibling;
    const action = input.dataset.action;
    
    btn.textContent = 'Recording...';
    input.value = 'Press keys...';
    
    function handleKeyDown(e) {
      e.preventDefault();
      
      const keys = [];
      if (e.ctrlKey) keys.push('ctrl');
      if (e.shiftKey) keys.push('shift');
      if (e.altKey) keys.push('alt');
      if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt') {
        keys.push(e.key.toLowerCase());
      }
      
      const shortcut = keys.join('+');
      input.value = shortcut;
      
      // Update settings
      settings.shortcuts.custom[action] = shortcut;
      
      // Cleanup
      btn.textContent = 'Record';
      document.removeEventListener('keydown', handleKeyDown);
    }
    
    document.addEventListener('keydown', handleKeyDown);
  });
});

// Update keyboard shortcut handling
function setupKeyboardShortcuts() {
  if (!settings.shortcuts.enabled) return;

  document.addEventListener('keydown', (e) => {
    const keys = [];
    if (e.ctrlKey) keys.push('ctrl');
    if (e.shiftKey) keys.push('shift');
    if (e.altKey) keys.push('alt');
    if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt') {
      keys.push(e.key.toLowerCase());
    }
    
    const shortcut = keys.join('+');
    const action = Object.entries(settings.shortcuts.custom)
      .find(([_, s]) => s === shortcut)?.[0];
    
    if (action) {
      e.preventDefault();
      executeAction(action);
    }
  });
}

function executeAction(action) {
  const actions = {
    newEntry: createNewEntry,
    save: saveEntry,
    search: focusSearch,
    settings: showSettingsModal,
    bold: () => editor?.format('bold', true),
    italic: () => editor?.format('italic', true),
    underline: () => editor?.format('underline', true),
    undo: () => editor?.history.undo(),
    redo: () => editor?.history.redo(),
    backup: createBackup,
    escape: handleEscape,
    sync: syncNow,
    toggleView: toggleViewMode,
    filterEntries: focusFilters,
    clearFilters: clearAllFilters,
    nextEntry: selectNextEntry,
    prevEntry: selectPrevEntry,
    duplicate: duplicateCurrentEntry,
    archive: archiveCurrentEntry
  };
  
  actions[action]?.();
}

// Add cloud sync to settings
document.querySelector('.modal-body').innerHTML += `
  <div class="settings-section">
    <h3>Cloud Sync</h3>
    <div class="setting-item">
      <label>
        <input type="checkbox" id="setting-sync-enabled" ${settings.sync.enabled ? 'checked' : ''}>
        Enable Cloud Sync
      </label>
    </div>
    <div class="setting-item">
      <label>Provider:</label>
      <select id="setting-sync-provider" ${!settings.sync.enabled ? 'disabled' : ''}>
        <option value="none">Select Provider</option>
        <option value="dropbox">Dropbox</option>
        <option value="google-drive">Google Drive</option>
        <option value="onedrive">OneDrive</option>
      </select>
    </div>
    <div class="setting-item">
      <label>
        <input type="checkbox" id="setting-autosync" ${!settings.sync.enabled ? 'disabled' : ''}>
        Auto Sync
      </label>
    </div>
    <div class="setting-item">
      <label>Sync Interval:</label>
      <select id="setting-sync-interval" ${!settings.sync.enabled || !settings.sync.autoSync ? 'disabled' : ''}>
        <option value="hourly">Every Hour</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
      </select>
    </div>
    <div class="setting-item">
      <button id="sync-now-btn" class="secondary-btn" ${!settings.sync.enabled ? 'disabled' : ''}>
        Sync Now
      </button>
      <span id="last-sync-time" class="text-sm text-gray-500">
        ${settings.sync.lastSync ? `Last synced: ${formatDate(settings.sync.lastSync)}` : 'Never synced'}
      </span>
    </div>
  </div>
`;

// Add sync event handlers
document.getElementById('setting-sync-enabled').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  document.getElementById('setting-sync-provider').disabled = !enabled;
  document.getElementById('setting-autosync').disabled = !enabled;
  document.getElementById('sync-now-btn').disabled = !enabled;
  
  if (!enabled) {
    document.getElementById('setting-sync-interval').disabled = true;
    document.getElementById('setting-autosync').checked = false;
  }
});

document.getElementById('setting-autosync').addEventListener('change', (e) => {
  document.getElementById('setting-sync-interval').disabled = !e.target.checked;
});

document.getElementById('sync-now-btn').addEventListener('click', syncNow);

async function syncNow() {
  try {
    const provider = document.getElementById('setting-sync-provider').value;
    if (provider === 'none') {
      showToast('Please select a sync provider', 'warning');
      return;
    }

    showToast('Syncing...', 'info');
    await ipcRenderer.invoke('sync-data', provider);
    
    settings.sync.lastSync = new Date().toISOString();
    document.getElementById('last-sync-time').textContent = 
      `Last synced: ${formatDate(settings.sync.lastSync)}`;
    
    showToast('Sync completed successfully');
  } catch (error) {
    showToast('Sync failed: ' + error.message, 'error');
  }
}

// Add more keyboard shortcuts
settings.shortcuts.custom = {
  'newEntry': 'ctrl+n',
  'save': 'ctrl+s',
  'search': 'ctrl+f',
  'settings': 'ctrl+,',
  'bold': 'ctrl+b',
  'italic': 'ctrl+i',
  'underline': 'ctrl+u',
  'undo': 'ctrl+z',
  'redo': 'ctrl+shift+z',
  'toggleView': 'ctrl+\\',
  'filterEntries': 'ctrl+shift+f',
  'clearFilters': 'ctrl+shift+x',
  'nextEntry': 'alt+down',
  'prevEntry': 'alt+up',
  'duplicate': 'ctrl+d'
};

// Add advanced theme settings to modal
document.querySelector('.settings-section:nth-child(2)').innerHTML += `
  <div class="setting-item">
    <label>Font Size:</label>
    <input type="range" id="setting-font-size" min="12" max="24" value="${parseInt(settings.advanced.fontSize)}">
    <span id="font-size-value">${settings.advanced.fontSize}</span>
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
    <label>Border Radius:</label>
    <input type="range" id="setting-border-radius" min="0" max="16" value="${settings.advanced.borderRadius}">
    <span id="border-radius-value">${settings.advanced.borderRadius}</span>
  </div>
  <div class="setting-item">
    <label>Spacing:</label>
    <select id="setting-spacing">
      <option value="compact">Compact</option>
      <option value="comfortable">Comfortable</option>
      <option value="spacious">Spacious</option>
    </select>
  </div>
  <div class="setting-item">
    <label>
      <input type="checkbox" id="setting-animations" checked>
      Enable Animations
    </label>
  </div>
  <div class="setting-item">
    <label>Custom CSS:</label>
    <textarea id="setting-custom-css" rows="4" placeholder="Enter custom CSS rules"></textarea>
  </div>
`;

// Add this function to handle all settings UI setup
async function setupSettingsUI() {
  const modalBody = document.querySelector('#settings-modal .modal-body');
  if (!modalBody) {
    throw new Error('Modal body not found');
  }

  try {
    // Get fresh settings from main process
    const currentSettings = await ipcRenderer.invoke('get-settings');
    if (currentSettings) {
      settings = currentSettings;
    }

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

    // Setup event handlers after HTML is inserted
    setupSettingsEventHandlers();
  } catch (error) {
    console.error('Failed to setup settings UI:', error);
    showToast('Failed to load settings interface', 'error');
  }
}

// Add this function to set up settings event handlers
function setupSettingsEventHandlers() {
  // Sync settings handlers
  const syncEnabled = document.getElementById('setting-sync-enabled');
  if (syncEnabled) {
    syncEnabled.addEventListener('change', (e) => {
      const enabled = e.target.checked;
      document.getElementById('setting-sync-provider').disabled = !enabled;
      document.getElementById('setting-autosync').disabled = !enabled;
      document.getElementById('sync-now-btn').disabled = !enabled;
      
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

  // Theme preset handler
  const themePreset = document.getElementById('theme-preset');
  if (themePreset) {
    themePreset.addEventListener('change', (e) => {
      const preset = themePresets[e.target.value];
      if (preset) {
        Object.entries(preset).forEach(([key, value]) => {
          const element = document.getElementById(`setting-${key}-color`);
          if (element) element.value = value;
        });
      }
    });
  }

  // ... other settings handlers ...
}
