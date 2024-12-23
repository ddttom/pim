import Editor from './editor.js';

let editorInstance = null;

export function initializeEditor() {
  const container = document.getElementById('editor').parentElement;
  editorInstance = new Editor(container);
  return editorInstance;
}

export function getEditor() {
  return editorInstance;
}

export function showEditor() {
  if (editorInstance) {
    editorInstance.focus();
  }
}

export function clearEditor() {
  if (editorInstance) {
    editorInstance.setContents('');
  }
}

export function getEditorContent() {
  if (!editorInstance) return { text: '', html: '' };
  return editorInstance.getContents();
}

export async function handleImageUpload(event, currentEntryId, ipcRenderer) {
  if (!editorInstance) return;
  await editorInstance.handleImageButton();
}
