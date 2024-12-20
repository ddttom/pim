import { getCurrentEntryId } from '../entries/entryActions.js';

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
        toolbar: {
          container: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['link', 'blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['image'],
            ['clean']
          ],
          handlers: {
            'image': () => this.handleImageButton()
          }
        }
      }
    });
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

  async handleImageButton() {
    let input = null;
    
    try {
      console.log('[Editor] Image button clicked');
      
      // Create and append file input
      input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);
      
      // Create a promise to handle the file selection
      const fileSelectionPromise = new Promise((resolve) => {
        input.onchange = (event) => resolve(event.target.files);
      });
      
      // Trigger file selection
      input.click();
      
      // Wait for file selection
      const files = await fileSelectionPromise;
      
      console.log('[Editor] File input change event triggered');
      
      const currentEntryId = getCurrentEntryId();
      console.log('[Editor] Current entry ID:', currentEntryId);
      
      if (!files || !files.length) {
        console.log('[Editor] No files selected');
        return;
      }
      
      console.log('[Editor] Processing files:', files.length);

      for (const file of files) {
        if (!currentEntryId) {
          console.log('[Editor] No current entry ID found');
          const { showToast } = await import('../utils/toast.js');
          showToast('Please save your entry first (click the Save button) before adding images', 'warning');
          
          // Create data URL for preview
          const reader = new FileReader();
          reader.onload = (e) => {
            const range = this.editor.getSelection(true);
            const link = `<a href="${e.target.result}">${file.name}</a>`;
            this.editor.clipboard.dangerouslyPasteHTML(range.index, link);
          };
          reader.readAsDataURL(file);
          continue;
        }

        console.log('[Editor] Processing file:', file.name);
        try {
          const buffer = await file.arrayBuffer();
          console.log('[Editor] File converted to buffer, size:', buffer.byteLength);
          
          console.log('[Editor] Sending to main process:', {
            entryId: currentEntryId,
            filename: file.name,
            bufferSize: buffer.byteLength
          });
          
          const imageInfo = await window.api.invoke('add-image', currentEntryId, buffer, file.name);
          console.log('[Editor] Received image info:', imageInfo);
          
          // Get the full path to the image in the user's data directory
          const userDataPath = await window.api.invoke('get-user-data-path');
          console.log('[Editor] User data path:', userDataPath);
          
          const imagePath = `file://${userDataPath}/data/${imageInfo.path}`;
          console.log('[Editor] Final image path:', imagePath);
          
          // Insert image into editor
          if (!this.editor) {
            console.error('[Editor] Quill editor instance not found');
            return;
          }
          
          const range = this.editor.getSelection(true);
          console.log('[Editor] Selected range:', range);
          
          this.editor.insertEmbed(range.index, 'image', imagePath);
          console.log('[Editor] Image inserted into editor');
        } catch (error) {
          console.error('[Editor] Error processing image:', error);
          console.error('[Editor] Error details:', {
            message: error.message,
            stack: error.stack
          });
          const { showToast } = await import('../utils/toast.js');
          showToast('Failed to upload image: ' + error.message, 'error');
        }
      }
    } catch (error) {
      console.error('[Editor] Error in handleImageButton:', error);
      console.error('[Editor] Error details:', {
        message: error.message,
        stack: error.stack
      });
      const { showToast } = await import('../utils/toast.js');
      showToast('Error handling image upload', 'error');
    } finally {
      if (input && input.parentNode) {
        // Clean up the input after selection
        setTimeout(() => {
          try {
            document.body.removeChild(input);
          } catch (e) {
            console.error('[Editor] Error cleaning up input:', e);
          }
        }, 1000);
      }
    }
  }

  get root() {
    return this.editor.root;
  }
}
