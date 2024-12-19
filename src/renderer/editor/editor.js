import { showToast } from '../utils/toast.js';
import parser from '../../services/parser.js';
import { loadEntriesList, showEntriesList } from '../entries/entryList.js';

let editor;

export function initializeEditor(settings) {
  try {
    console.log('Initializing editor');
    
    // Wait for DOM elements to be ready
    const editorContainer = document.getElementById('editor-container');
    if (!editorContainer) {
      throw new Error('Editor container not found');
    }

    // Initialize Quill editor first
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

    // Set up Save As button - with retry logic
    setTimeout(() => {
      setupSaveAsButton();
      console.log('Save As button setup attempted');
    }, 100); // Small delay to ensure DOM is ready

    // Apply initial editor settings
    if (settings) {
      editor.root.spellcheck = settings.spellcheck;
    }

    console.log('Editor initialization complete');
    return editor;
  } catch (error) {
    console.error('Failed to initialize editor:', error);
    throw error;
  }
}

function setupSaveAsButton() {
  console.log('Setting up Save As button');
  const editorActions = document.querySelector('.editor-actions');
  if (!editorActions) return;

  // Check if button already exists
  if (document.getElementById('save-as-btn')) return;

  // Update existing save button
  const saveBtn = editorActions.querySelector('#save-btn');
  if (saveBtn) {
    saveBtn.innerHTML = '<span class="btn-icon">💾</span>';
    saveBtn.title = 'Save (Ctrl+S)';
  }

  // Create Save As button
  const saveAsBtn = document.createElement('button');
  saveAsBtn.id = 'save-as-btn';
  saveAsBtn.className = 'secondary-btn';
  saveAsBtn.innerHTML = '<span class="btn-icon">📄</span>';
  saveAsBtn.title = 'Save As';

  // Create Image button
  const imageBtn = editorActions.querySelector('#image-btn');
  if (imageBtn) {
    imageBtn.innerHTML = '<span class="btn-icon">🖼️</span>';
    imageBtn.title = 'Add Images';
  }

  // Insert after Save button
  if (saveBtn) {
    saveBtn.after(saveAsBtn);
  }

  // Add click handler
  saveAsBtn.onclick = showSaveAsDialog;
}

async function showSaveAsDialog() {
  try {
    console.log('Opening Save As dialog');
    
    // Remove any existing modals and cleanup
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.remove('show');
      modal.remove();
    });
    document.body.classList.remove('modal-open');
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex'; // Force display flex
    
    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h2>Save As</h2>
          <button class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="content-type">Type:</label>
            <select id="content-type" class="form-control">
              <option value="note">Note</option>
              <option value="document">Document</option>
              <option value="template">Template</option>
              <option value="html">HTML</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button id="save-as-cancel" class="secondary-btn">Cancel</button>
          <button id="save-as-confirm" class="primary-btn">Save</button>
        </div>
      </div>
    `;

    // Append and show modal
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    
    // Force reflow and show modal
    void modal.offsetWidth; // Force reflow
    requestAnimationFrame(() => {
      modal.classList.add('show');
    });

    // Set up event handlers
    const closeModal = () => {
      modal.classList.remove('show');
      document.body.classList.remove('modal-open');
      setTimeout(() => modal.remove(), 200);
    };

    // Event handlers
    modal.querySelector('.close-btn').addEventListener('click', closeModal);
    modal.querySelector('#save-as-cancel').addEventListener('click', closeModal);
    modal.querySelector('#save-as-confirm').addEventListener('click', async () => {
      const type = modal.querySelector('#content-type').value;
      await saveContent(type);
      updateTypeBadge(type);
      closeModal();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Close on escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

  } catch (error) {
    console.error('Error showing Save As dialog:', error);
  }
}

async function saveContent(type) {
  try {
    const editorContent = {
      raw: editor.getText() || '',
      html: editor.root.innerHTML
    };
    
    // Check for blank content
    if (!editorContent.raw.trim()) {
      showToast('Cannot save blank entry', 'error');
      return;
    }

    // Get current entry if editing
    let currentEntry;
    const currentEntryId = window.currentEntryId; // Assuming this is set when loading an entry
    if (currentEntryId) {
      const entries = await window.api.invoke('get-entries', { id: currentEntryId });
      currentEntry = entries.find(e => e.id === currentEntryId);
    }

    // Use existing type or fallback to provided type or 'note'
    const contentType = currentEntry?.type || type || 'note';

    // Only parse if it's a note type
    let content;
    if (contentType === 'note') {
      const parsedContent = parser.parse(editorContent.raw);
      content = {
        raw: editorContent.raw,
        html: editorContent.html,
        type: contentType,
        parsed: parsedContent.parsed,
        ...parsedContent
      };
    } else {
      content = {
        raw: editorContent.raw,
        html: editorContent.html,
        type: contentType,
        parsed: {
          text: editorContent.raw,
          plugins: {}
        }
      };
    }

    // Save or update entry
    if (currentEntryId) {
      await window.api.invoke('update-entry', currentEntryId, content);
    } else {
      await window.api.invoke('add-entry', content);
    }
    
    // Update type badge after successful save
    updateTypeBadge(contentType);

    showToast('Entry saved successfully');
    
    // Refresh entries list and return to table view
    await loadEntriesList(window.api, (id) => loadEntry(id, window.api));
    document.querySelector('.sidebar')?.classList.remove('hidden');
    showEntriesList();
  } catch (error) {
    console.error('Failed to save content:', error);
    showToast('Failed to save content: ' + error.message, 'error');
  }
}

export function getEditor() {
  return editor;
}

export async function handleImageUpload(event, currentEntryId, ipcRenderer) {
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

export function showEditor() {
  const editorContainer = document.getElementById('editor-container');
  const entriesContainer = document.getElementById('entries-container');
  const sidebar = document.querySelector('.sidebar');
  const editorToolbar = document.querySelector('.ql-toolbar');
  const editorContent = document.querySelector('.ql-container');
  
  if (editorContainer && entriesContainer && sidebar) {
    editorContainer.classList.remove('hidden');
    entriesContainer.classList.add('hidden');
    sidebar.classList.add('hidden');
    
    // Show Quill components
    if (editorToolbar) {
      editorToolbar.style.display = 'block';
    }
    if (editorContent) {
      editorContent.style.display = 'block';
    }

    // Ensure Save As button is set up
    setupSaveAsButton();

    // Show type badge (get type from current entry or default to note)
    const currentType = window.currentEntryId ? 
      document.querySelector(`tr[data-id="${window.currentEntryId}"] .type-cell`)?.textContent || 'note' 
      : 'note';
    updateTypeBadge(currentType);
  }
}

export function clearEditor() {
  if (editor) {
    editor.setContents([]);
  }
}

export function getEditorContent() {
  return {
    raw: editor.getText() || '',
    html: editor.root.innerHTML
  };
}

// Editor actions
export const editorActions = {
  bold: () => editor?.format('bold', true),
  italic: () => editor?.format('italic', true),
  underline: () => editor?.format('underline', true),
  undo: () => editor?.history.undo(),
  redo: () => editor?.history.redo()
};

function updateTypeBadge(type = 'note') {
  const editorActions = document.querySelector('.editor-actions');
  if (!editorActions) return;

  // Remove existing badge if any
  const existingBadge = editorActions.querySelector('.editor-type-badge');
  if (existingBadge) {
    existingBadge.remove();
  }

  // Create new badge
  const badge = document.createElement('span');
  badge.className = `editor-type-badge ${type}`;
  badge.textContent = type;

  // Insert after buttons
  editorActions.appendChild(badge);
}
