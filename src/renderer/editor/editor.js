import { showToast } from '../utils/toast.js';

let editor;

export function initializeEditor(settings) {
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
  document.getElementById('editor-container').classList.remove('hidden');
  document.getElementById('save-btn').classList.remove('hidden');
  document.querySelector('.sidebar').classList.add('hidden');
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
