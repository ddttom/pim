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
            
            // Find the editor actions container
            const editorActions = this.container.querySelector('.editor-actions');
            if (!editorActions) {
                throw new Error('Editor actions container not found');
            }

            // Find existing buttons
            const saveBtn = editorActions.querySelector('#save-btn');
            const imageBtn = editorActions.querySelector('#image-btn');
            if (!saveBtn || !imageBtn) {
                throw new Error('Required buttons not found');
            }

            // Create and insert Save As button
            const saveAsBtn = document.createElement('button');
            saveAsBtn.id = 'save-as-btn';
            saveAsBtn.className = 'secondary-btn';
            saveAsBtn.innerHTML = `
                <span class="btn-icon">📝</span>
                Save As
            `;
            saveBtn.after(saveAsBtn);

            // Initialize Quill editor
            this.editor = new Quill('#editor', {
                // ... Quill config ...
            });

            // Set up event handlers
            saveBtn.onclick = () => this.saveContent('note');
            saveAsBtn.onclick = () => this.showSaveAsDialog();

            console.log('Editor initialized successfully');
        } catch (error) {
            console.error('Editor initialization failed:', error);
        }
    }

    showSaveAsDialog() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h2>Save As</h2>
                    <button class="close-btn">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="content-type">Type:</label>
                        <select id="content-type" class="form-control">
                            <option value="note">Note</option>
                            <option value="document">Document</option>
                            <option value="template">Template</option>
                            <option value="html">HTML</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="secondary-btn" id="save-as-cancel">Cancel</button>
                    <button class="primary-btn" id="save-as-confirm">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle close button
        modal.querySelector('.close-btn').onclick = () => modal.remove();
        modal.querySelector('#save-as-cancel').onclick = () => modal.remove();

        // Handle save
        modal.querySelector('#save-as-confirm').onclick = async () => {
            const type = modal.querySelector('#content-type').value;
            await this.saveContent(type);
            modal.remove();
        };
    }

    async saveContent(type) {
        const content = this.editor.getContents();
        await window.api.saveEntry({
            content: content.ops,
            type,
            updatedAt: new Date().toISOString()
        });
    }
}

export default Editor; 
