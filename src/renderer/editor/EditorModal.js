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

        // Create editor section
        const editorSection = document.createElement('div');
        editorSection.className = 'editor-section';

        // Create formatting toolbar
        const formatToolbar = document.createElement('div');
        formatToolbar.className = 'editor-toolbar';

        // Add Title button
        const titleGroup = document.createElement('div');
        titleGroup.className = 'toolbar-group';
        const titleBtn = document.createElement('button');
        titleBtn.textContent = 'Title';
        titleBtn.className = 'toolbar-btn';
        titleBtn.onclick = () => {
            if (this.editor?.editor) {
                const editor = this.editor.editor;
                // Save current selection
                const savedSelection = window.getSelection().getRangeAt(0).cloneRange();
                // Move cursor to start
                const range = document.createRange();
                range.setStart(editor.preview, 0);
                range.collapse(true);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                // Insert title
                editor.applyHeading(1);
                // Restore previous selection
                selection.removeAllRanges();
                selection.addRange(savedSelection);
            }
        };
        titleGroup.appendChild(titleBtn);
        formatToolbar.appendChild(titleGroup);

        // Add heading buttons
        const headingGroup = document.createElement('div');
        headingGroup.className = 'toolbar-group';
        ['H1', 'H2', 'H3', 'H4', 'H5'].forEach(h => {
            const btn = document.createElement('button');
            btn.textContent = h;
            btn.className = 'toolbar-btn';
            btn.onclick = () => this.editor?.editor.applyHeading(parseInt(h.slice(1)));
            headingGroup.appendChild(btn);
        });
        formatToolbar.appendChild(headingGroup);

        // Add font selector
        const fontGroup = document.createElement('div');
        fontGroup.className = 'toolbar-group';
        
        const fontSelect = document.createElement('select');
        fontSelect.className = 'toolbar-select';
        fontSelect.innerHTML = `
            <option value="normal">Normal</option>
            <option value="courier">Courier</option>
        `;
        fontSelect.onchange = (e) => this.editor?.editor.applyFont(e.target.value);
        fontGroup.appendChild(fontSelect);
        formatToolbar.appendChild(fontGroup);

        // Add table button with dropdown
        const tableGroup = document.createElement('div');
        tableGroup.className = 'toolbar-group';
        const tableDropdown = document.createElement('div');
        tableDropdown.className = 'table-dropdown';
        tableDropdown.style.position = 'relative';
        
        const tableBtn = document.createElement('button');
        tableBtn.className = 'toolbar-btn';
        tableBtn.textContent = 'Insert Table';
        tableBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdownContent.style.display = dropdownContent.style.display === 'none' ? 'block' : 'none';
        });

        const dropdownContent = document.createElement('div');
        dropdownContent.className = 'dropdown-content';
        dropdownContent.style.display = 'none';
        dropdownContent.style.position = 'absolute';
        dropdownContent.style.backgroundColor = '#fff';
        dropdownContent.style.border = '1px solid #ccc';
        dropdownContent.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        dropdownContent.style.zIndex = '1000';
        dropdownContent.style.padding = '10px';
        dropdownContent.style.top = '100%';
        dropdownContent.style.left = '0';

        // Add size indicator
        const sizeIndicator = document.createElement('div');
        sizeIndicator.style.textAlign = 'center';
        sizeIndicator.style.marginBottom = '5px';
        sizeIndicator.style.color = '#666';
        sizeIndicator.textContent = '0 × 0';
        dropdownContent.appendChild(sizeIndicator);
        
        // Create table grid
        const tableGrid = document.createElement('div');
        tableGrid.className = 'table-grid';
        tableGrid.style.display = 'grid';
        tableGrid.style.gridTemplateColumns = 'repeat(6, 20px)';
        tableGrid.style.gap = '2px';
        tableGrid.style.padding = '5px';
        
        // Setup table grid cells
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = i + 1;
                cell.dataset.col = j + 1;
                cell.style.width = '20px';
                cell.style.height = '20px';
                cell.style.border = '1px solid #ccc';
                cell.style.backgroundColor = '#fff';
                cell.style.cursor = 'pointer';
                
                // Handle hover
                cell.addEventListener('mouseenter', (e) => {
                    const cells = tableGrid.querySelectorAll('.grid-cell');
                    const targetRow = parseInt(e.target.dataset.row);
                    const targetCol = parseInt(e.target.dataset.col);
                    
                    cells.forEach(cell => {
                        const row = parseInt(cell.dataset.row);
                        const col = parseInt(cell.dataset.col);
                        if (row <= targetRow && col <= targetCol) {
                            cell.style.backgroundColor = '#e6f3ff';
                            cell.style.borderColor = '#99ccff';
                            sizeIndicator.textContent = `${targetRow} × ${targetCol}`;
                        } else {
                            cell.style.backgroundColor = '#fff';
                            cell.style.borderColor = '#ccc';
                        }
                    });
                });

                // Reset size indicator when leaving grid
                tableGrid.addEventListener('mouseleave', () => {
                    sizeIndicator.textContent = '0 × 0';
                    const cells = tableGrid.querySelectorAll('.grid-cell');
                    cells.forEach(cell => {
                        cell.style.backgroundColor = '#fff';
                        cell.style.borderColor = '#ccc';
                    });
                });
                
                // Handle click
                cell.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const rows = parseInt(e.target.dataset.row);
                    const cols = parseInt(e.target.dataset.col);
                    
                    // Insert table
                    this.editor?.editor.insertTable(rows, cols);
                    
                    // Hide dropdown
                    dropdownContent.style.display = 'none';
                    
                    // Focus editor
                    this.editor?.editor.focus();
                });
                
                tableGrid.appendChild(cell);
            }
        }
        
        dropdownContent.appendChild(tableGrid);
        tableDropdown.appendChild(tableBtn);
        tableDropdown.appendChild(dropdownContent);
        tableGroup.appendChild(tableDropdown);
        formatToolbar.appendChild(tableGroup);

        // Add click outside handler to close dropdown
        document.addEventListener('click', (e) => {
            if (!tableDropdown.contains(e.target)) {
                dropdownContent.style.display = 'none';
            }
        });

        // Add View Markdown button
        const viewGroup = document.createElement('div');
        viewGroup.className = 'toolbar-group';
        const viewBtn = document.createElement('button');
        viewBtn.className = 'toolbar-btn';
        viewBtn.textContent = 'Viewing Text';
        viewBtn.onclick = () => {
            const isMarkdownView = viewBtn.textContent === 'Viewing Text';
            viewBtn.textContent = isMarkdownView ? 'Viewing Markdown' : 'Viewing Text';
            viewBtn.style.backgroundColor = isMarkdownView ? '#e6f3ff' : '#f0f0f0';
            viewBtn.style.borderColor = isMarkdownView ? '#99ccff' : '#ccc';
            this.editor?.editor.toggleView();
            this.editor?.editor.updateMarkdownFromPreview();
        };
        viewBtn.style.backgroundColor = '#f0f0f0';
        viewBtn.style.borderColor = '#ccc';
        viewGroup.appendChild(viewBtn);
        formatToolbar.appendChild(viewGroup);

        // Create editor container
        const editorContainer = document.createElement('div');
        editorContainer.id = 'editor';
        editorContainer.className = 'editor-container';

        // Create image upload input
        const imageUpload = document.createElement('input');
        imageUpload.type = 'file';
        imageUpload.id = 'image-upload';
        imageUpload.accept = 'image/*';
        imageUpload.multiple = true;
        imageUpload.style.display = 'none';

        // Add elements to editor section
        editorSection.appendChild(formatToolbar);
        editorSection.appendChild(editorContainer);
        editorSection.appendChild(imageUpload);

        // Add all elements to content
        content.appendChild(ribbon);
        content.appendChild(editorSection);

        return content;
    }

    async show(options = {}) {
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
            requestAnimationFrame(async () => {
                this.editor = await new Editor(content).setup();
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
                const testParserBtn = content.querySelector('#test-parser-btn');

                if (saveBtn) {
                    saveBtn.addEventListener('click', async () => {
                        if (await this.editor.saveEntry()) {
                            // Refresh entries list
                            const { loadEntriesList } = await import('../entries/entryList.js');
                            await loadEntriesList(window.api);
                        }
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
                                            
                                            const markdownContent = this.editor.getText();
                                            const parsedContent = await window.api.invoke('test-parser', markdownContent);
                                            const entry = {
                                                raw: markdownContent,
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

    async loadEntry(id) {
        try {
            const entry = await window.api.invoke('get-entry', id);
            if (!entry) throw new Error('Entry not found');

            // Show editor modal with markdown content
            await this.show({
                title: `Edit ${entry.type || 'note'}`,
                content: entry.raw || ''
            });

            // Convert markdown to HTML for preview
            if (this.editor?.editor) {
                this.editor.editor.setText(entry.raw || '');
            }

            // Store entry ID for saving
            this.editor.entryId = id;
            
            return this.editor;
        } catch (error) {
            console.error('Failed to load entry:', error);
            const { showToast } = await import('../utils/toast.js');
            showToast('Failed to load entry: ' + error.message, 'error');
        }
    }
}
