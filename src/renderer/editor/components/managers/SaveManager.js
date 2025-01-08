import { Modal } from '../../../utils/modal.js';
import { showToast } from '../../../utils/toast.js';

export class SaveManager {
    constructor(editor) {
        this.editor = editor;
        if (!this.editor) {
            console.error('Editor not initialized');
        }
    }

    setupSaveButtons(saveBtn, saveAsBtn) {
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave());
        }

        if (saveAsBtn) {
            saveAsBtn.addEventListener('click', (e) => {
                const buttonRect = saveAsBtn.getBoundingClientRect();
                this.handleSaveAs(buttonRect);
            });
        }
    }

    async handleSave() {
        if (await this.editor?.saveEntry()) {
            // Refresh entries list
            const { loadEntriesList } = await import('../../../entries/entryList.js');
            await loadEntriesList(window.api);
        }
    }

    async handleSaveAs(buttonRect) {
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
                            
                            const markdownContent = this.editor.getText();
                            const parsedContent = await window.api.invoke('test-parser', markdownContent);
                            const entry = {
                                raw: markdownContent,
                                type: selectedType,
                                ...parsedContent
                            };

                            const newEntryId = await window.api.invoke('add-entry', entry);
                            const { loadEntriesList } = await import('../../../entries/entryList.js');
                            const { loadEntry } = await import('../../../entries/entryActions.js');
                            await loadEntriesList(window.api, (id) => loadEntry(id, window.api));
                            
                            showToast('Entry saved successfully');
                            
                            modal.close();
                            this.editor.close();
                        } catch (error) {
                            console.error('Failed to save entry:', error);
                            showToast('Failed to save entry: ' + error.message, 'error');
                        }
                    }
                }
            ]
        });
        modal.show();
    }
}
