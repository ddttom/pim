import { showToast } from '../utils/toast.js';
import { createNewEntry, saveEntry, duplicateCurrentEntry, archiveCurrentEntry } from '../entries/entryActions.js';
import { createBackup } from '../sync/sync.js';
import { defaultSettings } from '../settings/settings.js';
import { EditorModal } from './EditorModal.js';

function formatActionName(action) {
  return action
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

export function setupKeyboardShortcuts(settings = defaultSettings, ipcRenderer) {
  // Use default settings if none provided
  const shortcuts = settings?.shortcuts || defaultSettings.shortcuts;
  if (!shortcuts.enabled) return;

  // Create handler function
  const keydownHandler = (e) => {
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
  };

  // Add event listener
  document.addEventListener('keydown', keydownHandler);

  // Return cleanup function
  return () => {
    console.log('[Shortcuts] Cleaning up keyboard shortcuts');
    document.removeEventListener('keydown', keydownHandler);
  };
}

function executeAction(action, ipcRenderer) {
  const actions = {
    newEntry: () => createNewEntry(),
    save: () => saveEntry(ipcRenderer),
    search: () => document.getElementById('search-input')?.focus(),
    settings: () => document.getElementById('settings-btn').click(),
    bold: () => {
      const editor = EditorModal.getCurrentEditor();
      if (editor) editor.editor.format('bold', true);
    },
    italic: () => {
      const editor = EditorModal.getCurrentEditor();
      if (editor) editor.editor.format('italic', true);
    },
    underline: () => {
      const editor = EditorModal.getCurrentEditor();
      if (editor) editor.editor.format('underline', true);
    },
    undo: () => {
      const editor = EditorModal.getCurrentEditor();
      if (editor) editor.editor.history.undo();
    },
    redo: () => {
      const editor = EditorModal.getCurrentEditor();
      if (editor) editor.editor.history.redo();
    },
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
  const modals = document.querySelectorAll('.modal');
  const editorContainer = document.getElementById('editor-container');
  const sidebar = document.querySelector('.sidebar');

  // Close any open modal
  if (modals.length > 0) {
    modals.forEach(modal => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    });
    document.body.style.overflow = ''; // Restore scrolling
  } 
  // Or return to entries list
  else if (editorContainer && !editorContainer.classList.contains('hidden')) {
    editorContainer.classList.add('hidden');
    sidebar?.classList.remove('hidden');
  }
}

export function setupShortcutRecording(settings = defaultSettings) {
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

  // Setup recording buttons
  document.querySelectorAll('.record-shortcut-btn').forEach(btn => {
    const recordHandler = function() {
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
      // Track keydown handler for cleanup
      eventHandlers.set(document, new Map([['keydown', handleKeyDown]]));
    };

    addHandler(btn, 'click', recordHandler);
  });

  // Return cleanup function
  return () => {
    console.log('[Shortcuts] Cleaning up shortcut recording');
    eventHandlers.forEach((handlers, element) => {
      handlers.forEach((handler, event) => {
        element.removeEventListener(event, handler);
      });
    });
    eventHandlers.clear();
  };
}
