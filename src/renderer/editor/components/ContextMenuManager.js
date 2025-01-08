// Handles context menu operations
export class ContextMenuManager {
  constructor(editor) {
    this.editor = editor;
  }

  // Show context menu
  show(e) {
    e.preventDefault();
    
    const selection = window.getSelection();
    const cell = selection.focusNode instanceof Element ? 
      selection.focusNode.closest("td, th") : 
      selection.focusNode?.parentElement?.closest("td, th");

    // Create context menu
    const menu = this.createMenu();
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;

    // Add appropriate options based on context
    if (cell) {
      this.addTableOptions(menu, cell);
    } else {
      this.addTextOptions(menu);
    }

    document.body.appendChild(menu);

    // Close menu when clicking outside
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    };
    document.addEventListener("click", closeMenu);
  }

  // Create base menu element
  createMenu() {
    const menu = document.createElement("div");
    menu.className = "editor-context-menu";
    Object.assign(menu.style, {
      position: "fixed",
      zIndex: "1000",
      backgroundColor: "#fff",
      border: "1px solid #ccc",
      boxShadow: "2px 2px 5px rgba(0,0,0,0.2)",
      padding: "5px 0"
    });
    return menu;
  }

  // Add table-specific options
  addTableOptions(menu, cell) {
    const options = [
      { text: "Insert Row Above", action: () => this.editor.tableManager.insertRow(cell, "above") },
      { text: "Insert Row Below", action: () => this.editor.tableManager.insertRow(cell, "below") },
      { text: "Insert Column Left", action: () => this.editor.tableManager.insertColumn(cell, "left") },
      { text: "Insert Column Right", action: () => this.editor.tableManager.insertColumn(cell, "right") },
      { text: "Delete Row", action: () => this.editor.tableManager.deleteRow(cell) },
      { text: "Delete Column", action: () => this.editor.tableManager.deleteColumn(cell) },
      { text: "Merge All Cells in Row", action: () => this.editor.tableManager.mergeCells(cell) }
    ];

    options.forEach(({ text, action }) => {
      this.addMenuItem(menu, text, () => {
        action();
        menu.remove();
        this.editor.updateMarkdownFromPreview();
      });
    });
  }

  // Add text-specific options
  addTextOptions(menu) {
    const options = [
      { text: "Copy", action: () => this.editor.clipboardManager.copy() },
      { text: "Cut", action: () => this.editor.clipboardManager.cut() },
      { text: "Paste", action: () => this.editor.clipboardManager.paste() },
      { text: "Insert Table", action: () => this.editor.tableManager.insertTable() }
    ];

    options.forEach(({ text, action }) => {
      this.addMenuItem(menu, text, () => {
        action();
        menu.remove();
      });
    });
  }

  // Add a menu item
  addMenuItem(menu, text, action) {
    const option = document.createElement("div");
    option.textContent = text;
    Object.assign(option.style, {
      padding: "5px 20px",
      cursor: "pointer",
      userSelect: "none"
    });

    option.addEventListener("mouseenter", () => {
      option.style.backgroundColor = "#f0f0f0";
    });
    option.addEventListener("mouseleave", () => {
      option.style.backgroundColor = "transparent";
    });
    option.addEventListener("click", action);

    menu.appendChild(option);
  }
}
