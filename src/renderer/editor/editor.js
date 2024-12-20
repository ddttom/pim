export default class Editor {
  constructor(container) {
    // Find editor div in the container
    const editorDiv = container.querySelector('#editor');
    if (!editorDiv) {
      throw new Error('Editor div not found in container');
    }

    // Initialize Quill editor
    this.editor = new Quill(editorDiv, {
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

    // Set up image upload handler
    const imageUpload = container.querySelector('#image-upload');
    if (imageUpload) {
      imageUpload.addEventListener('change', this.handleImageUpload.bind(this));
    }
  }

  getText() {
    return this.editor.getText() || '';
  }

  getContents() {
    return {
      raw: this.getText(),
      html: this.editor.root.innerHTML
    };
  }

  setContents(content) {
    if (typeof content === 'string') {
      this.editor.root.innerHTML = content;
    } else {
      this.editor.setContents([]);
    }
  }

  focus() {
    this.editor.focus();
  }

  async handleImageUpload(event) {
    const files = event.target.files;
    if (!files.length || !window.currentEntryId) return;

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const imageInfo = await window.api.invoke('add-image', window.currentEntryId, buffer, file.name);
      
      // Insert image into editor
      const range = this.editor.getSelection(true);
      this.editor.insertEmbed(range.index, 'image', imageInfo.path);
    }
  }

  get root() {
    return this.editor.root;
  }
}
