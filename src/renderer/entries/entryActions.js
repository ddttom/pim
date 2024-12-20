import { showToast } from '../utils/toast.js';
import { getEditor, showEditor, clearEditor, getEditorContent } from '../editor/editor.js';
import { loadEntriesList, showEntriesList } from './entryList.js';
import parser from '../../services/parser.js';

let currentEntryId = null;

export function getCurrentEntryId() {
  return currentEntryId;
}

export function createNewEntry() {
  currentEntryId = null;
  clearEditor();
  showEditor();
}

export async function loadEntry(id, ipcRenderer) {
  try {
    currentEntryId = id;
    const entries = await ipcRenderer.invoke('get-entries', { id });
    const entry = entries.find(e => e.id === id);
    if (!entry) throw new Error('Entry not found');
    
    const editor = getEditor();
    editor.root.innerHTML = entry.html || entry.raw;
    
    showEditor();
  } catch (error) {
    console.error('Failed to load entry:', error);
    showToast('Failed to load entry', 'error');
  }
}

export async function saveEntry(ipcRenderer) {
  try {
    const editorContent = getEditorContent();
    
    // Check for blank content
    if (!editorContent.raw.trim()) {
      showToast('Cannot save blank entry', 'error');
      return;
    }

    // Parse content and create entry object
    const parsedContent = parser.parse(editorContent.raw);
    const content = {
      raw: editorContent.raw,
      html: editorContent.html,
      ...parsedContent
    };

    if (currentEntryId) {
      await ipcRenderer.invoke('update-entry', currentEntryId, content);
    } else {
      currentEntryId = await ipcRenderer.invoke('add-entry', content);
    }

    showToast('Entry saved successfully');
    await loadEntriesList(ipcRenderer, (id) => loadEntry(id, ipcRenderer));
    
    // Return to table view after successful save
    const editorContainer = document.getElementById('editor-container');
    const entriesContainer = document.getElementById('entries-container');
    
    if (editorContainer) {
      editorContainer.classList.add('hidden');
    }
    if (entriesContainer) {
      entriesContainer.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Failed to save entry:', error);
    showToast('Failed to save entry: ' + error.message, 'error');
  }
}

export async function deleteEntry(id, ipcRenderer) {
  if (confirm('Are you sure you want to delete this entry?')) {
    try {
      await ipcRenderer.invoke('delete-entry', id);
      await loadEntriesList(ipcRenderer, (id) => loadEntry(id, ipcRenderer));
      showToast('Entry deleted successfully');
    } catch (error) {
      console.error('Failed to delete entry:', error);
      showToast('Failed to delete entry', 'error');
    }
  }
}

export async function duplicateCurrentEntry(ipcRenderer) {
  if (!currentEntryId) {
    showToast('No entry selected to duplicate', 'warning');
    return;
  }

  try {
    const editorContent = getEditorContent();
    const parsedContent = parser.parse(editorContent.raw);
    const content = {
      raw: editorContent.raw,
      html: editorContent.html,
      ...parsedContent
    };
    currentEntryId = await ipcRenderer.invoke('add-entry', content);
    showToast('Entry duplicated successfully');
    await loadEntriesList(ipcRenderer, (id) => loadEntry(id, ipcRenderer));
  } catch (error) {
    console.error('Failed to duplicate entry:', error);
    showToast('Failed to duplicate entry', 'error');
  }
}

export async function archiveCurrentEntry(ipcRenderer) {
  if (!currentEntryId) {
    showToast('No entry selected to archive', 'warning');
    return;
  }

  try {
    await ipcRenderer.invoke('archive-entry', currentEntryId);
    showToast('Entry archived successfully');
    await loadEntriesList(ipcRenderer, (id) => loadEntry(id, window.api));
  } catch (error) {
    console.error('Failed to archive entry:', error);
    showToast('Failed to archive entry', 'error');
  }
}
