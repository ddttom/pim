import { showToast } from '../utils/toast.js';

let editor;

export function initializeEditor(settings) {
  try {
    // Hide editor container and components by default
    const editorContainer = document.getElementById('editor-container');
    const editorToolbar = document.querySelector('.ql-toolbar');
    const editorContent = document.querySelector('.ql-container');
    
    if (editorContainer) {
      editorContainer.classList.add('hidden');
    }
    if (editorToolbar) {
      editorToolbar.style.display = 'none';
    }
    if (editorContent) {
      editorContent.style.display = 'none';
    }
    
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

    // Hide Quill components after initialization
    const toolbar = document.querySelector('.ql-toolbar');
    const container = document.querySelector('.ql-container');
    if (toolbar) toolbar.style.display = 'none';
    if (container) container.style.display = 'none';

    return editor;
  } catch (error) {
    console.error('Failed to initialize editor:', error);
    throw error;
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