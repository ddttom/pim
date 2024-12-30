import { showToast } from '../utils/toast.js';
import { EditorModal } from '../editor/EditorModal.js';
import { loadEntriesList } from './entryList.js';
import parser from '../../services/parser.js';

let currentEntryId = null;
let editorModal = null;

export function getCurrentEntryId() {
  return currentEntryId;
}

export async function createNewEntry(ipcRenderer) {
  // Reset current entry
  currentEntryId = null;

  // Create new editor modal
  editorModal = new EditorModal();
  await editorModal.show({
    title: 'New Entry'
  });
}

export async function loadEntry(id, ipcRenderer) {
  try {
    currentEntryId = id;
    const entries = await ipcRenderer.invoke('get-entries', { id });
    const entry = entries.find(e => e.id === id);
    if (!entry) throw new Error('Entry not found');
    
    // Create new editor modal with entry content
    editorModal = new EditorModal();
    await editorModal.show({
      title: `Edit Entry (${entry.type || 'note'})`,
      content: entry.html || entry.raw
    });
  } catch (error) {
    console.error('Failed to load entry:', error);
    showToast('Failed to load entry', 'error');
  }
}

export async function saveEntry(ipcRenderer) {
  try {
    if (!editorModal || !editorModal.getEditor()) {
      showToast('No active editor', 'error');
      return;
    }

    const editor = editorModal.getEditor();
    const editorContent = {
      raw: editor.getText(),
      html: editor.root.innerHTML
    };
    
    // Check for blank content
    if (!editorContent.raw.trim()) {
      showToast('Cannot save blank entry', 'error');
      return;
    }

    // Get current entry if editing to preserve type
    let currentEntry;
    if (currentEntryId) {
      const entries = await ipcRenderer.invoke('get-entries', { id: currentEntryId });
      currentEntry = entries.find(e => e.id === currentEntryId);
    }

    // Parse content and create entry object
    const parsedContent = parser.parse(editorContent.raw);
    const content = {
      raw: editorContent.raw,
      html: editorContent.html,
      type: currentEntry?.type || 'note', // Preserve type or default to note
      ...parsedContent
    };

    if (currentEntryId) {
      await ipcRenderer.invoke('update-entry', currentEntryId, content);
    } else {
      currentEntryId = await ipcRenderer.invoke('add-entry', content);
    }

    showToast('Entry saved successfully');
    await loadEntriesList(ipcRenderer, (id) => loadEntry(id, ipcRenderer));
    
    // Close editor modal
    editorModal.close();
    editorModal = null;
  } catch (error) {
    console.error('Failed to save entry:', error);
    showToast('Failed to save entry: ' + error.message, 'error');
  }
}

export async function deleteEntry(id, ipcRenderer) {
  const { Modal } = await import('../utils/modal.js');
  
  const modal = new Modal({
    title: 'Delete Entry',
    content: 'Are you sure you want to delete this entry? This action cannot be undone.',
    buttons: [
      {
        text: 'Cancel',
        onClick: () => modal.close()
      },
      {
        text: 'Delete',
        primary: true,
        onClick: async () => {
          try {
            await ipcRenderer.invoke('delete-entry', id);
            await loadEntriesList(ipcRenderer, (id) => loadEntry(id, ipcRenderer));
            showToast('Entry deleted successfully');
            modal.close();
          } catch (error) {
            console.error('Failed to delete entry:', error);
            showToast('Failed to delete entry', 'error');
          }
        }
      }
    ]
  });
  
  modal.show();
}

export async function duplicateCurrentEntry(ipcRenderer) {
  if (!currentEntryId) {
    showToast('No entry selected to duplicate', 'warning');
    return;
  }

  try {
    if (!editorModal || !editorModal.getEditor()) {
      showToast('No active editor', 'error');
      return;
    }

    const editor = editorModal.getEditor();
    const editorContent = {
      raw: editor.getText(),
      html: editor.root.innerHTML
    };
    // Get original entry to preserve type
    const entries = await ipcRenderer.invoke('get-entries', { id: currentEntryId });
    const originalEntry = entries.find(e => e.id === currentEntryId);
    if (!originalEntry) throw new Error('Entry not found');

    const parsedContent = parser.parse(editorContent.raw);
    const content = {
      raw: editorContent.raw,
      html: editorContent.html,
      type: originalEntry.type, // Preserve type from original entry
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
