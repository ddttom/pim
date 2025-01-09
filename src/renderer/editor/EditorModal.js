import { Modal } from '../utils/modal.js';
import Editor from '../../components/Editor.js';
import { RibbonManager } from './components/managers/RibbonManager.js';
import { ToolbarManager } from './components/managers/ToolbarManager.js';
import { TableManager } from './components/managers/TableManager.js';
import { SaveManager } from './components/managers/SaveManager.js';
import { ImageManager } from './components/managers/ImageManager.js';
import { ParserManager } from './components/managers/ParserManager.js';

export class EditorModal {
    static currentEditor = null;

    constructor() {
        this.modal = null;
        this.editor = null;
        this.managers = {};
    }

    static getCurrentEditor() {
        return EditorModal.currentEditor;
    }

    initializeManagers() {
        // Initialize managers after editor is set up
        if (!this.editor) return;
        
        this.managers = {
            ribbon: new RibbonManager(this.editor),
            toolbar: new ToolbarManager(this.editor),
            table: new TableManager(this.editor),
            save: new SaveManager(this.editor),
            image: new ImageManager(this.editor),
            parser: new ParserManager(this.editor)
        };
    }

    createEditorContent() {
        const content = document.createElement('div');
        content.className = 'editor-container';
        content.setAttribute('dir', 'ltr');

        // Create content structure first
        const ribbon = document.createElement('div');
        ribbon.className = 'ribbon';
        content.appendChild(ribbon);

        // Create editor section
        const editorSection = document.createElement('div');
        editorSection.className = 'editor-section';
        editorSection.setAttribute('dir', 'ltr');

        // Create editor container
        const editorContainer = document.createElement('div');
        editorContainer.id = 'editor';
        editorContainer.className = 'editor-container';
        editorContainer.setAttribute('dir', 'ltr');
        editorSection.appendChild(editorContainer);

        // Create image upload input placeholder
        const imageUpload = document.createElement('input');
        imageUpload.type = 'file';
        imageUpload.id = 'image-upload';
        imageUpload.accept = 'image/*';
        imageUpload.multiple = true;
        imageUpload.style.display = 'none';
        editorSection.appendChild(imageUpload);

        // Add editor section to content
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
                // Initialize editor and wait for setup
                this.editor = await new Editor(content).setup();
                EditorModal.currentEditor = this.editor;
                
                // Initialize managers
                this.initializeManagers();

                // Now replace placeholders with manager-created components
                const ribbon = this.managers.ribbon.createRibbon();
                content.replaceChild(ribbon, content.querySelector('.ribbon'));

                const imageUpload = this.managers.image.createImageUpload();
                const oldImageUpload = content.querySelector('#image-upload');
                const editorSection = content.querySelector('.editor-section');
                if (editorSection && oldImageUpload) {
                    editorSection.replaceChild(imageUpload, oldImageUpload);
                }

                // Setup button handlers
                const saveBtn = ribbon.querySelector('#save-btn');
                const saveAsBtn = ribbon.querySelector('#save-as-btn');
                const imageBtn = ribbon.querySelector('#image-btn');
                const testParserBtn = ribbon.querySelector('#test-parser-btn');

                // Setup functionality
                this.managers.save.setupSaveButtons(saveBtn, saveAsBtn);
                this.managers.image.setupImageHandlers(imageBtn, imageUpload);
                this.managers.parser.setupParserButton(testParserBtn);

                // Set content if provided
                if (options.content) {
                    this.editor.editor.setText(options.content);
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
