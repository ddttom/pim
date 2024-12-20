import { showToast } from '../utils/toast.js';
import parser from '../../services/parser.js';
import { loadEntriesList } from '../entries/entryList.js';

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
    saveBtn.innerHTML = `<span class="btn-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM19 19H5V5H16.17L19 7.83V19ZM12 12C10.34 12 9 13.34 9 15C9 16.66 10.34 18 12 18C13.66 18 15 16.66 15 15C15 13.34 13.66 12 12 12ZM6 6H15V10H6V6Z" fill="currentColor"/>
      </svg>
    </span>`;
    saveBtn.title = 'Save (Ctrl+S)';
  }

  // Create Save As button
  const saveAsBtn = document.createElement('button');
  saveAsBtn.id = 'save-as-btn';
  saveAsBtn.className = 'secondary-btn';
  saveAsBtn.innerHTML = `<span class="btn-icon">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM19 19H5V5H16.17L19 7.83V19ZM12 12C10.34 12 9 13.34 9 15C9 16.66 10.34 18 12 18C13.66 18 15 16.66 15 15C15 13.34 13.66 12 12 12ZM6 6H15V10H6V6Z" fill="currentColor"/>
    </svg>
  </span>`;
  saveAsBtn.title = 'Save As';

  // Create Image button
  const imageBtn = editorActions.querySelector('#image-btn');
  if (imageBtn) {
    imageBtn.innerHTML = `<span class="btn-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
      </svg>
    </span>`;
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
    const currentEntryId = window.currentEntryId;
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
    
    // Show entries list but keep sidebar hidden
    const editorContainer = document.getElementById('editor-container');
    const entriesContainer = document.getElementById('entries-container');
    
    if (editorContainer) {
      editorContainer.classList.add('hidden');
    }
    if (entriesContainer) {
      entriesContainer.classList.remove('hidden');
    }
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
  // Get all relevant containers
  const editorContainer = document.getElementById('editor-container');
  const entriesContainer = document.getElementById('entries-container');
  const sidebar = document.querySelector('.sidebar');
  const editorToolbar = document.querySelector('.ql-toolbar');
  const editorContent = document.querySelector('.ql-container');
  
  // Hide entries list and sidebar
  if (entriesContainer) {
    entriesContainer.classList.add('hidden');
  }
  if (sidebar) {
    sidebar.classList.add('hidden');
  }
  
  // Show editor and its components
  if (editorContainer) {
    editorContainer.classList.remove('hidden');
  }
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

  // Focus editor
  if (editor) {
    editor.focus();
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
