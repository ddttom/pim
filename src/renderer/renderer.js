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
      'redo': 'ctrl+shift+z',
      'backup': 'ctrl+shift+s',
      'escape': 'esc',
      'header1': 'alt+1',
      'header2': 'alt+2',
      'header3': 'alt+3'
    }
  },
  notifications: true,
  autoBackup: {
    enabled: false,
    interval: 'daily'
  },
  sync: {
    enabled: false,
    provider: 'none', // 'none', 'dropbox', 'google-drive', 'onedrive'
    autoSync: false,
    syncInterval: 'hourly', // 'hourly', 'daily', 'weekly'
    lastSync: null
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  initializeEditor();
  await loadEntriesList();
  setupEventListeners();
  showEntriesList();
});

function initializeEditor() {
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
}

function setupEventListeners() {
  document.getElementById('save-btn').addEventListener('click', saveEntry);
  document.getElementById('new-entry-btn').addEventListener('click', createNewEntry);
  document.getElementById('image-btn').addEventListener('click', () => {
    document.getElementById('image-upload').click();
  });
  document.getElementById('image-upload').addEventListener('change', handleImageUpload);

  // Search input
  document.getElementById('search-input').addEventListener('input', debounce((e) => {
    currentFilters.search = e.target.value;
    loadEntriesList();
  }, 300));

  // Sort select
  document.getElementById('sort-select').addEventListener('change', (e) => {
    currentFilters.sort = e.target.value;
    loadEntriesList();
  });

  // Status filters
  document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const filterType = e.target.closest('.filter-group').querySelector('label').textContent.toLowerCase().replace(':', '');
      const value = e.target.value;
      
      if (e.target.checked) {
        currentFilters[filterType].add(value);
      } else {
        currentFilters[filterType].delete(value);
      }
      
      loadEntriesList();
    });
  });

  // Add back button handler
  document.getElementById('back-btn').addEventListener('click', () => {
    showEntriesList();
  });

  // Add settings button handler
  document.getElementById('settings-btn').addEventListener('click', showSettingsModal);
  document.getElementById('backup-btn').addEventListener('click', createBackup);
  document.getElementById('restore-btn').addEventListener('click', restoreBackup);

  // Add keyboard shortcut handling
  document.addEventListener('keydown', (e) => {
    const shortcut = [
      e.ctrlKey ? 'ctrl' : '',
      e.key.toLowerCase()
    ].filter(Boolean).join('+');

    const handler = KEYBOARD_SHORTCUTS[shortcut];
    if (handler) {
      e.preventDefault();
      handler();
    }
  });
}

async function loadEntriesList() {
  const entries = await ipcRenderer.invoke('get-entries');
  const filteredEntries = filterEntries(entries);
  const sortedEntries = sortEntries(filteredEntries);
  
  renderEntries(sortedEntries);
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
  entriesList.innerHTML = '';

  if (entries.length === 0) {
    entriesList.innerHTML = `
      <div class="empty-state">
        <p>No entries yet. Create your first entry!</p>
        <button class="primary-btn" onclick="createNewEntry()">New Entry</button>
      </div>
    `;
    return;
  }

  entries.forEach(entry => {
    const div = document.createElement('div');
    div.className = 'entry-item';
    div.innerHTML = `
      <div class="entry-header">
        <h3>${entry.content.raw.substring(0, 50)}${entry.content.raw.length > 50 ? '...' : ''}</h3>
        <span class="entry-date">${formatDate(entry.created_at)}</span>
      </div>
      <div class="entry-preview">${formatPreview(entry)}</div>
      <div class="entry-actions">
        <button class="edit-btn" onclick="loadEntry('${entry.id}')">Edit</button>
        <button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button>
      </div>
    `;
    entriesList.appendChild(div);
  });
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
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
    const content = editor.root.innerHTML;
    const markdown = turndown.turndown(content);
    
    const entry = {
      raw_content: editor.getText(),
      markdown: markdown,
      parsed: await ipcRenderer.invoke('parse-text', editor.getText())
    };

    if (currentEntryId) {
      await ipcRenderer.invoke('update-entry', currentEntryId, entry);
    } else {
      currentEntryId = await ipcRenderer.invoke('add-entry', entry);
    }

    await loadEntriesList();
    showEntriesList();
  } catch (error) {
    console.error('Failed to save entry:', error);
    alert('Failed to save entry');
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
  document.getElementById('editor-container').classList.add('hidden');
  document.getElementById('entries-list').parentElement.classList.remove('hidden');
}

function showEditor() {
  document.getElementById('editor-container').classList.remove('hidden');
  document.getElementById('entries-list').parentElement.classList.add('hidden');
}

async function showSettingsModal() {
  try {
    // Load current settings
    settings = await ipcRenderer.invoke('get-settings');
    
    // Update form values
    document.getElementById('setting-autosave').checked = settings.autosave;
    document.getElementById('setting-spellcheck').checked = settings.spellcheck;
    document.getElementById('setting-theme').value = settings.theme.name;
    document.getElementById('setting-date-format').value = settings.dateFormat;
    
    document.getElementById('settings-modal').classList.remove('hidden');
  } catch (error) {
    showToast('Failed to load settings', 'error');
  }
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
}

async function saveSettings() {
  try {
    const newSettings = {
      ...settings,
      autosave: document.getElementById('setting-autosave').checked,
      spellcheck: document.getElementById('setting-spellcheck').checked,
      theme: {
        name: document.getElementById('setting-theme').value,
        custom: {
          primary: document.getElementById('setting-primary-color').value,
          secondary: document.getElementById('setting-secondary-color').value,
          background: document.getElementById('setting-background-color').value,
          text: settings.theme.custom.text,
          accent: settings.theme.custom.accent
        }
      },
      dateFormat: document.getElementById('setting-date-format').value,
      shortcuts: document.getElementById('setting-shortcuts').checked,
      notifications: document.getElementById('setting-notifications').checked,
      autoBackup: {
        enabled: document.getElementById('setting-autobackup').value !== '',
        interval: document.getElementById('setting-autobackup').value || 'daily'
      }
    };

    await ipcRenderer.invoke('update-settings', newSettings);
    settings = newSettings;
    
    applySettings();
    closeSettingsModal();
    showToast('Settings saved successfully', 'success');
  } catch (error) {
    showToast('Failed to save settings', 'error');
  }
}

function applySettings() {
  // Apply theme
  const { theme } = settings;
  document.documentElement.style.setProperty('--primary-color', theme.custom.primary);
  document.documentElement.style.setProperty('--secondary-color', theme.custom.secondary);
  document.documentElement.style.setProperty('--background-color', theme.custom.background);
  document.documentElement.style.setProperty('--text-color', theme.custom.text);
  document.documentElement.style.setProperty('--accent-color', theme.custom.accent);
  
  document.body.className = theme.name;
  
  // Apply spell check
  editor.root.spellcheck = settings.spellcheck;
  
  // Setup autosave if enabled
  if (settings.autosave) {
    editor.on('text-change', debounce(() => {
      if (currentEntryId) saveEntry();
    }, 1000));
  }

  // Setup auto backup if enabled
  if (settings.autoBackup.enabled) {
    setupAutoBackup();
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
    bold: () => editor.format('bold', true),
    italic: () => editor.format('italic', true),
    underline: () => editor.format('underline', true),
    undo: () => editor.history.undo(),
    redo: () => editor.history.redo(),
    backup: createBackup,
    escape: handleEscape,
    header1: () => editor.format('header', 1),
    header2: () => editor.format('header', 2),
    header3: () => editor.format('header', 3),
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
let settings = {
  // ... existing settings ...
  sync: {
    enabled: false,
    provider: 'none', // 'none', 'dropbox', 'google-drive', 'onedrive'
    autoSync: false,
    syncInterval: 'hourly', // 'hourly', 'daily', 'weekly'
    lastSync: null
  }
};

// Add cloud sync section to settings modal
document.querySelector('.modal-body').innerHTML += `
  <div class="settings-section">
    <h3>Cloud Sync</h3>
    <div class="setting-item">
      <label>
        <input type="checkbox" id="setting-sync-enabled">
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
  ...settings.shortcuts.custom,
  'sync': 'ctrl+shift+y',
  'toggleView': 'ctrl+\\',
  'filterEntries': 'ctrl+shift+f',
  'clearFilters': 'ctrl+shift+x',
  'nextEntry': 'alt+down',
  'prevEntry': 'alt+up',
  'duplicate': 'ctrl+d',
  'archive': 'ctrl+shift+a'
};

// Add actions for new shortcuts
function executeAction(action) {
  const actions = {
    // ... existing actions ...
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

// Add theme customization
const advancedThemeSettings = {
  fontSize: '16px',
  fontFamily: 'system-ui',
  borderRadius: '4px',
  spacing: 'comfortable', // 'compact', 'comfortable', 'spacious'
  animations: true,
  customCSS: ''
};

// Add advanced theme settings to modal
document.querySelector('.settings-section:nth-child(2)').innerHTML += `
  <div class="setting-item">
    <label>Font Size:</label>
    <input type="range" id="setting-font-size" min="12" max="24" value="16">
    <span id="font-size-value">16px</span>
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
    <input type="range" id="setting-border-radius" min="0" max="16" value="4">
    <span id="border-radius-value">4px</span>
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
