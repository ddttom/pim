import { Modal } from '../utils/modal.js';
import Editor from '../../components/Editor.js';

export class EditorModal {
    static currentEditor = null;

    constructor() {
        this.modal = null;
        this.editor = null;
    }

    static getCurrentEditor() {
        return EditorModal.currentEditor;
    }

    createEditorContent() {
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

        const settingsBtn = document.createElement('button');
        settingsBtn.id = 'settings-btn';
        settingsBtn.className = 'secondary-btn ribbon-btn';
        settingsBtn.setAttribute('data-shortcut', 'Ctrl+,');
        settingsBtn.innerHTML = `
            <span class="btn-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.68 19.18 11.36 19.13 11.06L21.16 9.48C21.34 9.34 21.39 9.07 21.28 8.87L19.36 5.55C19.24 5.33 18.99 5.26 18.77 5.33L16.38 6.29C15.88 5.91 15.35 5.59 14.76 5.35L14.4 2.81C14.36 2.57 14.16 2.4 13.92 2.4H10.08C9.84 2.4 9.65 2.57 9.61 2.81L9.25 5.35C8.66 5.59 8.12 5.92 7.63 6.29L5.24 5.33C5.02 5.25 4.77 5.33 4.65 5.55L2.74 8.87C2.62 9.08 2.66 9.34 2.86 9.48L4.89 11.06C4.84 11.36 4.8 11.69 4.8 12C4.8 12.31 4.82 12.64 4.87 12.94L2.84 14.52C2.66 14.66 2.61 14.93 2.72 15.13L4.64 18.45C4.76 18.67 5.01 18.74 5.23 18.67L7.62 17.71C8.12 18.09 8.65 18.41 9.24 18.65L9.6 21.19C9.65 21.43 9.84 21.6 10.08 21.6H13.92C14.16 21.6 14.36 21.43 14.39 21.19L14.75 18.65C15.34 18.41 15.88 18.09 16.37 17.71L18.76 18.67C18.98 18.75 19.23 18.67 19.35 18.45L21.27 15.13C21.39 14.91 21.34 14.66 21.15 14.52L19.14 12.94ZM12 15.6C10.02 15.6 8.4 13.98 8.4 12C8.4 10.02 10.02 8.4 12 8.4C13.98 8.4 15.6 10.02 15.6 12C15.6 13.98 13.98 15.6 12 15.6Z" fill="currentColor"/>
                </svg>
            </span>
            <span class="btn-label">Settings</span>
        `;

        rightSection.appendChild(testParserBtn);
        rightSection.appendChild(settingsBtn);

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

        return content;
    }

    show(options = {}) {
        const content = this.createEditorContent();
        
    this.modal = new Modal({
        title: options.title || 'Editor',
        content: content,
        width: '100%',
        height: '100%',
        className: 'editor-modal',
        modalClassName: 'editor-modal',
        onClose: () => {
            EditorModal.currentEditor = null;
            this.editor = null;
            this.modal = null;
        }
    });

        this.modal.show();

        // Initialize editor after modal is shown and rendered
        return new Promise((resolve) => {
            requestAnimationFrame(() => {
                this.editor = new Editor(content);
                EditorModal.currentEditor = this.editor;
                
                // Set content if provided
                if (options.content) {
                    this.editor.root.innerHTML = options.content;
                }

                // Setup button event listeners
                const saveBtn = content.querySelector('#save-btn');
                const saveAsBtn = content.querySelector('#save-as-btn');
                const imageBtn = content.querySelector('#image-btn');
                const imageUpload = content.querySelector('#image-upload');
                const settingsBtn = content.querySelector('#settings-btn');
                const testParserBtn = content.querySelector('#test-parser-btn');

                if (saveBtn) {
                    saveBtn.addEventListener('click', async () => {
                        const { saveEntry } = await import('../entries/entryActions.js');
                        saveEntry(window.api);
                    });
                }

                if (saveAsBtn) {
                    saveAsBtn.addEventListener('click', async () => {
                        const types = ['note', 'document', 'template', 'html', 'record', 'task', 'event'];
                        const content = document.createElement('div');
                        content.className = 'save-as-content';
                        content.innerHTML = `
                            <div class="form-group">
                                <label for="type-select">Save as type:</label>
                                <select id="type-select" class="form-control">
                                    ${types.map(type => `<option value="${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</option>`).join('')}
                                </select>
                            </div>
                        `;

                        // Get button position
                        const buttonRect = saveAsBtn.getBoundingClientRect();
                        
                        const modal = new Modal({
                            title: 'Save As',
                            content: content,
                            position: {
                                top: buttonRect.bottom + 'px',
                                left: buttonRect.left + 'px'
                            },
                            buttons: [
                                {
                                    text: 'Cancel',
                                    onClick: () => modal.close()
                                },
                                {
                                    text: 'Save',
                                    primary: true,
                                    onClick: async () => {
                                        try {
                                            const typeSelect = content.querySelector('#type-select');
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
                                            
                                            modal.close();
                                            this.close();
                                        } catch (error) {
                                            console.error('Failed to save entry:', error);
                                            const { showToast } = await import('../utils/toast.js');
                                            showToast('Failed to save entry: ' + error.message, 'error');
                                        }
                                    }
                                }
                            ]
                        });
                        modal.show();
                    });
                }

                if (imageBtn && imageUpload) {
                    imageBtn.addEventListener('click', () => {
                        imageUpload.click();
                    });

                    imageUpload.addEventListener('change', async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;

                        // TODO: Implement image upload functionality
                    });
                }

                if (settingsBtn) {
                    settingsBtn.addEventListener('click', async () => {
                        const { setupSettingsUI, saveSettings } = await import('../settings/settingsUI.js');
                        const { defaultSettings } = await import('../settings/settings.js');
                        
                        const settings = await window.api.invoke('get-settings') || defaultSettings;
                        const buttonRect = settingsBtn.getBoundingClientRect();
                        const modalWidth = 300; // Width of the modal
                        
                        const modal = new Modal({
                            title: 'Settings',
                            content: document.createElement('div'),
                            position: {
                                top: buttonRect.bottom + 'px',
                                left: (buttonRect.right - modalWidth) + 'px'
                            },
                            buttons: [
                                {
                                    text: 'Cancel',
                                    onClick: () => modal.close()
                                },
                                {
                                    text: 'Save Changes',
                                    primary: true,
                                    onClick: async () => {
                                        try {
                                            const updatedSettings = await saveSettings(settings, window.api);
                                            await window.api.invoke('update-settings', updatedSettings);
                                            modal.close();
                                        } catch (error) {
                                            console.error('Failed to save settings:', error);
                                        }
                                    }
                                }
                            ]
                        });
                        modal.show();
                        
                        // Initialize settings UI in the modal
                        setupSettingsUI(modal.element.querySelector('.modal-body'), settings, window.api);
                    });
                }

                if (testParserBtn) {
                    testParserBtn.addEventListener('click', async () => {
                        const results = await window.api.invoke('test-parser', this.editor.getText());
                        
                        const content = document.createElement('div');
                        const pre = document.createElement('pre');
                        pre.textContent = JSON.stringify(results, null, 2);
                        content.appendChild(pre);

                        const copyBtn = document.createElement('button');
                        copyBtn.className = 'primary-btn';
                        copyBtn.innerHTML = `
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                            </svg>
                            Copy to Clipboard
                        `;
                        copyBtn.onclick = async () => {
                            navigator.clipboard.writeText(pre.textContent);
                            const { showToast } = await import('../utils/toast.js');
                            showToast('Copied to clipboard');
                        };
                        content.appendChild(copyBtn);

                        const buttonRect = testParserBtn.getBoundingClientRect();
                        const modalWidth = 800; // Width of the modal
                        
                        const resultsModal = new Modal({
                            title: 'Parser Test Results',
                            content: content,
                            width: modalWidth + 'px',
                            position: {
                                top: buttonRect.bottom + 'px',
                                left: (buttonRect.right - modalWidth) + 'px'
                            }
                        });
                        resultsModal.show();
                    });
                }

                resolve(this.editor);
            });
        });
    }

    close() {
        if (this.modal) {
            this.modal.close();
        }
    }

    getEditor() {
        return this.editor;
    }
}
