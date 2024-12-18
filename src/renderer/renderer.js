const { ipcRenderer } = require('electron');
const Quill = require('quill');
const Turndown = require('turndown');
const turndown = new Turndown();

let editor;
let currentEntryId = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Quill editor
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

  // Setup event listeners
  document.getElementById('save-btn').addEventListener('click', saveEntry);
  document.getElementById('image-btn').addEventListener('click', () => {
    document.getElementById('image-upload').click();
  });
  
  document.getElementById('image-upload').addEventListener('change', handleImageUpload);

  // Load initial entries
  loadEntries();
});

async function saveEntry() {
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

  loadEntries();
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

function loadEntry(entry) {
  currentEntryId = entry.id;
  editor.root.innerHTML = entry.content.markdown;
}
