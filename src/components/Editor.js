class Editor {
    constructor(container) {
        if (!container) {
            throw new Error('Editor container is required');
        }
        this.container = container;
        this.initialize();
    }

    initialize() {
        try {
            console.log('Initializing editor');

            // Find editor div
            const editorDiv = this.container.querySelector('#editor');
            if (!editorDiv) {
                throw new Error('Editor div not found');
            }

            // Initialize Quill editor
            this.editor = new Quill(editorDiv, {
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
        } catch (error) {
            console.error('Editor initialization failed:', error);
            throw error;
        }
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
}

export default Editor;
