import { showToast } from '../utils/toast.js';
import { createNewEntry, saveEntry, duplicateCurrentEntry, archiveCurrentEntry } from '../entries/entryActions.js';
import { showSettingsModal } from '../settings/settingsUI.js';
import { editorActions } from './editor.js';
import { createBackup } from '../sync/sync.js';
import { defaultSettings } from '../settings/settings.js';

function formatActionName(action) {
  return action
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

export function setupKeyboardShortcuts(settings = defaultSettings, ipcRenderer) {
  // Use default settings if none provided
  const shortcuts = settings?.shortcuts || defaultSettings.shortcuts;
  if (!shortcuts.enabled) return;

  document.addEventListener('keydown', (e) => {
    const keys = [];
    if (e.ctrlKey) keys.push('ctrl');
    if (e.shiftKey) keys.push('shift');
    if (e.altKey) keys.push('alt');
    if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt') {
      keys.push(e.key.toLowerCase());
    }
    
    const shortcut = keys.join('+');
    const action = Object.entries(shortcuts.custom)
      .find(([_, s]) => s === shortcut)?.[0];
    
    if (action) {
      e.preventDefault();
      executeAction(action, ipcRenderer);
    }
  });
}

function executeAction(action, ipcRenderer) {
  const actions = {
    newEntry: () => createNewEntry(),
    save: () => saveEntry(ipcRenderer),
    search: () => document.getElementById('search-input')?.focus(),
    settings: showSettingsModal,
    bold: editorActions.bold,
    italic: editorActions.italic,
    underline: editorActions.underline,
    undo: editorActions.undo,
    redo: editorActions.redo,
    backup: () => createBackup(ipcRenderer),
    escape: handleEscape,
    duplicate: () => duplicateCurrentEntry(ipcRenderer),
    archive: () => archiveCurrentEntry(ipcRenderer)
  };
  
  try {
    actions[action]?.();
  } catch (error) {
    console.error('Failed to execute action:', error);
    showToast(`Failed to execute ${formatActionName(action)}`, 'error');
  }
}

function handleEscape() {
  const settingsModal = document.getElementById('settings-modal');
  const editorContainer = document.getElementById('editor-container');
  const sidebar = document.querySelector('.sidebar');

  if (settingsModal && !settingsModal.classList.contains('hidden')) {
    settingsModal.classList.add('hidden');
  } else if (editorContainer && !editorContainer.classList.contains('hidden')) {
    editorContainer.classList.add('hidden');
    sidebar?.classList.remove('hidden');
  }
}

export function setupShortcutRecording(settings = defaultSettings) {
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
        if (settings?.shortcuts?.custom) {
          settings.shortcuts.custom[action] = shortcut;
        }
        
        // Cleanup
        btn.textContent = 'Record';
        document.removeEventListener('keydown', handleKeyDown);
      }
      
      document.addEventListener('keydown', handleKeyDown);
    });
  });
}