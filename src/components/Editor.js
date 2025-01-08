import { MarkdownEditor } from '../renderer/editor/MarkdownEditor.js';

class Editor {
    constructor(container) {
        if (!container) {
            throw new Error('Editor container is required');
        }
        this.container = container;
        this.editor = null;
        this._entryId = null;
    }

    async setup() {
        try {
            console.log('Initializing editor');

            // Find editor div and set direction
            const editorDiv = this.container.querySelector('#editor');
            if (!editorDiv) {
                throw new Error('Editor div not found');
            }
            editorDiv.setAttribute('dir', 'ltr');
            editorDiv.style.direction = 'ltr';
            editorDiv.style.unicodeBidi = 'isolate';

            // Initialize Markdown editor
            this.editor = new MarkdownEditor(editorDiv);
            await this.editor.setup(); // Wait for editor setup

            // Set up image upload handler
            const imageUpload = this.container.querySelector('#image-upload');
            if (imageUpload) {
                imageUpload.addEventListener('change', this.handleImageUpload.bind(this));
            }

            console.log('Editor initialized successfully');
            return this;
        } catch (error) {
            console.error('Editor initialization failed:', error);
            throw error;
        }
    }

    getText() {
        return this.editor?.editor?.getText() || '';
    }

    getContents() {
        return {
            text: this.getText(),
            html: this.editor?.editor?.preview?.innerHTML || ''
        };
    }

    setContents(content) {
        if (!this.editor?.editor) return;
        
        if (typeof content === 'string') {
            this.editor.editor.setText(content);
        } else if (content && content.text) {
            this.editor.editor.setText(content.text);
        }
    }

    get root() {
        return this.editor?.editor?.preview;
    }

    get entryId() {
        return this._entryId;
    }

    set entryId(id) {
        this._entryId = id;
    }

    async handleImageUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0 || !this.entryId) return;

        for (const file of files) {
            const buffer = await file.arrayBuffer();
            const imageInfo = await window.api.invoke('add-image', this.entryId, buffer, file.name);
            
            // Insert image into editor using markdown syntax
            const imageMarkdown = `![${file.name}](${imageInfo.path})`;
            if (this.editor?.editor) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const textNode = document.createTextNode(imageMarkdown);
                    range.insertNode(textNode);
                    range.setStartAfter(textNode);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        }
    }

    async saveEntry() {
        try {
            const content = {
                raw: this.getText(),
                html: this.root?.innerHTML || ''
            };

            // Parse content
            const parsedContent = await window.api.invoke('test-parser', content.raw);

            if (this.entryId) {
                // Update existing entry
                const entry = {
                    id: this.entryId,
                    ...content,
                    ...parsedContent
                };
                await window.api.invoke('update-entry', entry);
            } else {
                // Create new entry
                const entry = {
                    ...content,
                    ...parsedContent,
                    type: 'note'
                };
                const newEntryId = await window.api.invoke('add-entry', entry);
                this.entryId = newEntryId;
            }

            const { showToast } = await import('../renderer/utils/toast.js');
            showToast('Entry saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save entry:', error);
            const { showToast } = await import('../renderer/utils/toast.js');
            showToast('Failed to save entry: ' + error.message, 'error');
            return false;
        }
    }
}

export default Editor;
