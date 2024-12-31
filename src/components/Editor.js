class Editor {
    constructor(container) {
        if (!container) {
            throw new Error('Editor container is required');
        }
        this.container = container;
        this.editor = null;
        this._entryId = null;
    }

    async initialize() {
        try {
            console.log('Initializing editor');

            // Find editor div
            const editorDiv = this.container.querySelector('#editor');
            if (!editorDiv) {
                throw new Error('Editor div not found');
            }

            // Load Quill styles
            const quillStyles = document.createElement('link');
            quillStyles.rel = 'stylesheet';
            quillStyles.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
            document.head.appendChild(quillStyles);

            // Load Quill script
            await new Promise((resolve, reject) => {
                const quillScript = document.createElement('script');
                quillScript.src = 'https://cdn.quilljs.com/1.3.6/quill.js';
                quillScript.onload = resolve;
                quillScript.onerror = reject;
                document.head.appendChild(quillScript);
            });

            // Initialize Quill editor
            this.editor = new window.Quill(editorDiv, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'script': 'sub'}, { 'script': 'super' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                        [{ 'direction': 'rtl' }],
                        [{ 'size': ['small', false, 'large', 'huge'] }],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'font': [] }],
                        [{ 'align': [] }],
                        ['clean']
                    ]
                }
            });

            console.log('Editor initialized successfully');
            return this.editor;
        } catch (error) {
            console.error('Editor initialization failed:', error);
            throw error;
        }
    }

    async setup() {
        await this.initialize();
        return this;
    }

    getText() {
        return this.editor.getText();
    }

    getContents() {
        return this.editor.getContents();
    }

    setContents(content) {
        this.editor.setContents(content);
    }

    format(name, value) {
        this.editor.format(name, value);
    }

    get root() {
        return this.editor.root;
    }

    get history() {
        return this.editor.history;
    }

    get entryId() {
        return this._entryId;
    }

    set entryId(id) {
        this._entryId = id;
    }

    async saveEntry() {
        try {
            const content = {
                raw: this.getText(),
                html: this.root.innerHTML
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
