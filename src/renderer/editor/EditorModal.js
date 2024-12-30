import { Modal } from '../utils/modal.js';
import Editor from '../../components/Editor.js';
import modalStateManager from '../utils/modalStateManager.js';

export class EditorModal {
  static currentEditor = null;

  constructor() {
    console.log('[Editor Modal] Initializing');
    this.modal = null;
    this.editor = null;
    this.modalId = `editor-modal-${Date.now()}`;
    this.secondaryModals = new Set();
    this.isUpdating = false;

    // Register with state manager
    modalStateManager.registerModal(this.modalId, {
      type: 'editor',
      hasSecondaryModal: false,
      secondaryModals: []
    });

    // Subscribe to state changes
    modalStateManager.subscribe(this.modalId, this.handleStateChange.bind(this));
  }

  handleStateChange(action, state) {
    if (this.isUpdating) return;

    try {
      this.isUpdating = true;

      switch (action) {
        case 'update':
          if (state.hasSecondaryModal !== undefined) {
            this.updateSecondaryModalState(state.hasSecondaryModal);
          }
          break;
        case 'unregister':
          this.cleanup();
          break;
      }
    } finally {
      this.isUpdating = false;
    }
  }

  updateSecondaryModalState(hasSecondaryModal) {
    console.log(`[Modal State] Updating secondary modal state: ${hasSecondaryModal}`);
    if (this.modal?.container) {
      if (hasSecondaryModal) {
        this.modal.container.classList.add('has-secondary-modal');
      } else {
        this.modal.container.classList.remove('has-secondary-modal');
      }
    }
  }

  registerSecondaryModal(id) {
    console.log(`[Editor Modal] Registering secondary modal: ${id}`);
    if (this.secondaryModals.has(id)) return;

    this.secondaryModals.add(id);
    if (!this.isUpdating) {
      modalStateManager.updateModalState(this.modalId, { 
        hasSecondaryModal: true,
        secondaryModals: Array.from(this.secondaryModals)
      });
    }
  }

  unregisterSecondaryModal(id) {
    console.log(`[Editor Modal] Unregistering secondary modal: ${id}`);
    if (!this.secondaryModals.has(id)) return;

    this.secondaryModals.delete(id);
    if (!this.isUpdating) {
      modalStateManager.updateModalState(this.modalId, { 
        hasSecondaryModal: this.secondaryModals.size > 0,
        secondaryModals: Array.from(this.secondaryModals)
      });
    }
  }

  createEditorContent() {
    console.log('[Editor Modal] Creating editor content');
    const content = document.createElement('div');
    content.className = 'editor-container';

    // Create ribbon
    const ribbon = document.createElement('div');
    ribbon.className = 'ribbon';

    // Create left section
    const leftSection = document.createElement('div');
    leftSection.className = 'ribbon-section';

    // Create save buttons
    const saveBtn = document.createElement('button');
    saveBtn.id = 'save-btn';
    saveBtn.className = 'primary-btn ribbon-btn';
    saveBtn.setAttribute('data-shortcut', 'Ctrl+S');
    saveBtn.innerHTML = `
      <span class="btn-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM19 19H5V5H16.17L19 7.83V19ZM12 12C10.34 12 9 13.34 9 15C9 16.66 10.34 18 12 18C13.66 18 15 16.66 15 15C15 13.34 13.66 12 12 12ZM6 6H15V10H6V6Z" fill="currentColor"/>
        </svg>
      </span>
      <span class="btn-label">Save</span>
    `;

    const saveAsBtn = document.createElement('button');
    saveAsBtn.id = 'save-as-btn';
    saveAsBtn.className = 'secondary-btn ribbon-btn';
    saveAsBtn.innerHTML = `
      <span class="btn-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM19 19H5V5H16.17L19 7.83V19ZM12 12C10.34 12 9 13.34 9 15C9 16.66 10.34 18 12 18C13.66 18 15 16.66 15 15C15 13.34 13.66 12 12 12ZM6 6H15V10H6V6Z" fill="currentColor"/>
        </svg>
      </span>
      <span class="btn-label">Save As</span>
    `;

    leftSection.appendChild(saveBtn);
    leftSection.appendChild(saveAsBtn);

    // Create middle section
    const middleSection = document.createElement('div');
    middleSection.className = 'ribbon-section';

    const imageBtn = document.createElement('button');
    imageBtn.id = 'image-btn';
    imageBtn.className = 'secondary-btn ribbon-btn';
    imageBtn.innerHTML = `
      <span class="btn-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
        </svg>
      </span>
      <span class="btn-label">Images</span>
    `;

    middleSection.appendChild(imageBtn);

    // Create right section
    const rightSection = document.createElement('div');
    rightSection.className = 'ribbon-section';

    const testParserBtn = document.createElement('button');
    testParserBtn.id = 'test-parser-btn';
    testParserBtn.className = 'secondary-btn ribbon-btn';
    testParserBtn.innerHTML = `
      <span class="btn-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z" fill="currentColor"/>
        </svg>
      </span>
      <span class="btn-label">Test Parser</span>
    `;

    rightSection.appendChild(testParserBtn);

    // Add dividers
    const divider1 = document.createElement('div');
    divider1.className = 'ribbon-divider';
    const divider2 = document.createElement('div');
    divider2.className = 'ribbon-divider';

    // Add sections to ribbon
    ribbon.appendChild(leftSection);
    ribbon.appendChild(divider1);
    ribbon.appendChild(middleSection);
    ribbon.appendChild(divider2);
    ribbon.appendChild(rightSection);

    // Create editor div
    const editorDiv = document.createElement('div');
    editorDiv.id = 'editor';

    // Create image upload input
    const imageUpload = document.createElement('input');
    imageUpload.type = 'file';
    imageUpload.id = 'image-upload';
    imageUpload.accept = 'image/*';
    imageUpload.multiple = true;
    imageUpload.style.display = 'none';

    // Add all elements to content
    content.appendChild(ribbon);
    content.appendChild(editorDiv);
    content.appendChild(imageUpload);

    // Add event handlers
    saveBtn.addEventListener('click', async () => {
      const { saveEntry } = await import('../entries/entryActions.js');
      saveEntry(window.api);
    });

    saveAsBtn.addEventListener('click', async () => {
      if (this.secondaryModals.size > 0) {
        console.log('[Save As] Secondary modal already open');
        return;
      }

      const saveAsModalId = `save-as-modal-${Date.now()}`;
      this.registerSecondaryModal(saveAsModalId);

      const types = ['note', 'document', 'template', 'html', 'record', 'task', 'event'];
      const modalContent = document.createElement('div');
      modalContent.className = 'save-as-content';
      modalContent.innerHTML = `
        <div class="form-group">
          <label for="type-select">Save as type:</label>
          <select id="type-select" class="form-control">
            ${types.map(type => `<option value="${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</option>`).join('')}
          </select>
        </div>
      `;

      const buttonRect = saveAsBtn.getBoundingClientRect();
      
      const saveAsModal = new Modal({
        id: saveAsModalId,
        title: 'Save As',
        content: modalContent,
        position: {
          top: buttonRect.bottom + 'px',
          left: buttonRect.left + 'px'
        },
        buttons: [
          {
            text: 'Cancel',
            onClick: () => saveAsModal.close()
          },
          {
            text: 'Save',
            primary: true,
            onClick: async () => {
              try {
                const typeSelect = modalContent.querySelector('#type-select');
                const selectedType = typeSelect.value;
                
                const editorContent = {
                  raw: this.editor.getText(),
                  html: this.editor.root.innerHTML
                };

                const parsedContent = await window.api.invoke('test-parser', editorContent.raw);
                const entry = {
                  raw: editorContent.raw,
                  html: editorContent.html,
                  type: selectedType,
                  ...parsedContent
                };

                const newEntryId = await window.api.invoke('add-entry', entry);
                const { loadEntriesList } = await import('../entries/entryList.js');
                const { loadEntry } = await import('../entries/entryActions.js');
                await loadEntriesList(window.api, (id) => loadEntry(id, window.api));
                
                const { showToast } = await import('../utils/toast.js');
                showToast('Entry saved successfully');
                
                saveAsModal.close();
                this.close();
              } catch (error) {
                console.error('Failed to save entry:', error);
                const { showToast } = await import('../utils/toast.js');
                showToast('Failed to save entry: ' + error.message, 'error');
              }
            }
          }
        ],
        onClose: () => {
          this.unregisterSecondaryModal(saveAsModalId);
        }
      });

      saveAsModal.show();
    });

    imageBtn.addEventListener('click', () => {
      imageUpload.click();
    });

    imageUpload.addEventListener('change', async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      // TODO: Implement image upload functionality
    });

    testParserBtn.addEventListener('click', async () => {
      if (this.secondaryModals.size > 0) {
        console.log('[Parser Test] Secondary modal already open');
        return;
      }

      const parserModalId = `parser-modal-${Date.now()}`;
      this.registerSecondaryModal(parserModalId);

      const results = await window.api.invoke('test-parser', this.editor.getText());
      
      const modalContent = document.createElement('div');
      modalContent.className = 'parser-results';
      modalContent.innerHTML = `
        <div class="ribbon">
          <div class="ribbon-section">
            <button class="ribbon-btn secondary-btn" id="copy-results-btn">
              <span class="btn-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                </svg>
              </span>
              <span class="btn-label">Copy to Clipboard</span>
            </button>
          </div>
        </div>
        <div class="parser-results-content">
          <pre>${JSON.stringify(results, null, 2)}</pre>
        </div>
      `;

      const buttonRect = testParserBtn.getBoundingClientRect();
      const modalWidth = 800;

      const parserModal = new Modal({
        id: parserModalId,
        title: 'Parser Test Results',
        content: modalContent,
        width: modalWidth + 'px',
        position: {
          top: buttonRect.bottom + 'px',
          left: (buttonRect.right - modalWidth) + 'px'
        },
        onClose: () => {
          this.unregisterSecondaryModal(parserModalId);
        }
      });

      // Add copy button handler
      const copyBtn = modalContent.querySelector('#copy-results-btn');
      copyBtn.addEventListener('click', async () => {
        const pre = modalContent.querySelector('pre');
        await navigator.clipboard.writeText(pre.textContent);
        const { showToast } = await import('../utils/toast.js');
        showToast('Copied to clipboard');
      });

      parserModal.show();
    });

    return content;
  }

  async show(options = {}) {
    console.log('[Editor Modal] Opening with options:', options);
    const content = this.createEditorContent();
    
    this.modal = new Modal({
      id: this.modalId,
      title: options.title || 'Editor',
      content: content,
      width: '100%',
      height: '100%',
      className: 'editor-modal',
      modalClassName: 'editor-modal',
      onClose: () => {
        console.log('[Editor Modal] Closing editor modal');
        this.cleanup();
      }
    });

    this.modal.show();

    // Initialize editor after modal is shown
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        console.log('[Editor Modal] Initializing editor');
        this.editor = new Editor(content);
        EditorModal.currentEditor = this.editor;
        
        if (options.content) {
          this.editor.root.innerHTML = options.content;
        }

        resolve(this.editor);
      });
    });
  }

  close() {
    console.log('[Editor Modal] Closing editor modal');
    if (this.modal) {
      this.modal.close();
    }
  }

  cleanup() {
    console.log('[Editor Modal] Cleaning up resources');
    
    // Clean up secondary modals
    this.secondaryModals.forEach(id => {
      modalStateManager.unregisterModal(id);
    });
    this.secondaryModals.clear();

    // Clean up state
    modalStateManager.unregisterModal(this.modalId);
    modalStateManager.unsubscribe(this.modalId, this.handleStateChange);

    // Clean up references
    EditorModal.currentEditor = null;
    this.editor = null;
    this.modal = null;
  }

  getEditor() {
    return this.editor;
  }
}
