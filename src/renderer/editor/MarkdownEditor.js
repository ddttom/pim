import { MarkdownConverter } from './components/MarkdownConverter.js';
import { TableManager } from './components/TableManager.js';
import { ClipboardManager } from './components/ClipboardManager.js';
import { ContextMenuManager } from './components/ContextMenuManager.js';
import { EditorCore } from './components/EditorCore.js';

export class MarkdownEditor {
  constructor(container) {
    // Create converter first since other components need it
    const converter = new MarkdownConverter();

    // Initialize core with converter
    this.core = new EditorCore(container, converter);

    // Initialize other components
    this.tableManager = new TableManager(this);
    this.clipboardManager = new ClipboardManager(this);
    this.contextMenuManager = new ContextMenuManager(this);
  }

  // Setup editor
  async setup() {
    // Initialize editor core
    this.core.init();
    
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

  // For compatibility with EditorModal
  get editor() {
    return this.core;
  }

  // Expose preview for direct access
  get preview() {
    return this.core.preview;
  }
}
