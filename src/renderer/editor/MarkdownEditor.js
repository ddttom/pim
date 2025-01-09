import { MarkdownConverter } from './components/MarkdownConverter.js';
import { TableManager } from './components/TableManager.js';
import { ClipboardManager } from './components/ClipboardManager.js';
import { ContextMenuManager } from './components/ContextMenuManager.js';
import { EditorCore } from './components/EditorCore.js';
import { ToolbarManager } from './components/managers/ToolbarManager.js';

export class MarkdownEditor {
  constructor(container) {
    // Store container reference
    this.container = container;

    // Create converter first since other components need it
    const converter = new MarkdownConverter();

    // Initialize components
    this.toolbarManager = new ToolbarManager(this);
    this.tableManager = new TableManager(this);
    this.clipboardManager = new ClipboardManager(this);
    this.contextMenuManager = new ContextMenuManager(this);

    // Create editor container for core
    const editorContainer = document.createElement('div');
    editorContainer.className = 'editor-section';
    container.appendChild(editorContainer);

    // Initialize core with editor container
    this.core = new EditorCore(editorContainer, converter);
  }

  // Setup editor
  async setup() {
    // Create and add toolbar
    const toolbar = this.toolbarManager.createToolbar();
    this.container.insertBefore(toolbar, this.container.firstChild);

    // Initialize editor core
    this.core.init();
    
    // Set up core references
    this.core.setEditor(this);
    this.core.setToolbar(this.toolbarManager);
    
    // Add event listeners
    this.addEventListeners();

    // Return self for chaining
    return this;
  }

  // Add event listeners
  addEventListeners() {
    // Table navigation
    this.core.preview.addEventListener("keydown", (e) => {
      const selection = window.getSelection();
      const cell = selection.focusNode instanceof Element ? 
        selection.focusNode.closest("td, th") : 
        selection.focusNode?.parentElement?.closest("td, th");
      
      if (cell && e.key === "Tab") {
        e.preventDefault();
        this.tableManager.navigate(cell, e.shiftKey ? "backward" : "forward");
      }
    });

    // Clipboard handling
    this.core.preview.addEventListener("paste", (e) => {
      this.clipboardManager.handlePasteEvent(e);
    });

    // Context menu
    this.core.preview.addEventListener("contextmenu", (e) => {
      this.contextMenuManager.show(e);
    });
  }

  // Public API methods
  toggleView() {
    // Let EditorCore handle all view toggling and content conversion
    this.core.toggleView();
  }

  focus() {
    this.core.focus();
  }

  setText(markdown) {
    this.core.setText(markdown);
  }

  getText() {
    return this.core.getText();
  }

  applyHeading(level) {
    this.core.applyHeading(level);
  }

  applyFont(fontName) {
    this.core.applyFont(fontName);
  }

  applyStyle(style) {
    this.core.applyStyle(style);
  }

  // For compatibility with EditorModal
  get editor() {
    return this.core;
  }

  // For toolbar access
  get toolbar() {
    return this.toolbarManager;
  }

  // Expose preview for direct access
  get preview() {
    return this.core.preview;
  }
}
