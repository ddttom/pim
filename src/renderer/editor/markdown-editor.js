export class MarkdownEditor {
  constructor(container) {
    this.container = container;
    this.markdownTextarea = null;
    this.preview = null;
    this.markdownPanel = null;
    this.selectedCells = new Set();
    this.isDragging = false;
    this.dragStartCell = null;
    this.isMarkdownView = false;
    this.initEditor();
  }

  // Toggle between markdown and preview views
  toggleView() {
    this.isMarkdownView = !this.isMarkdownView;
    if (this.isMarkdownView) {
      this.preview.style.display = 'none';
      this.markdownTextarea.style.display = 'block';
      this.markdownTextarea.style.width = '100%';
      this.markdownTextarea.style.height = '100%';
      this.markdownTextarea.style.fontFamily = 'monospace';
      this.markdownTextarea.style.padding = '10px';
      this.markdownTextarea.style.border = 'none';
      this.markdownTextarea.style.resize = 'none';
      this.markdownTextarea.style.outline = 'none';
      this.updateMarkdownFromPreview();
      this.markdownTextarea.focus();
    } else {
      this.preview.style.display = 'block';
      this.markdownTextarea.style.display = 'none';
      this.preview.innerHTML = this.markdownToHtml(this.markdownTextarea.value);
      this.preview.focus();
    }
  }

  // Initialize editor setup
  initEditor() {
    const editorContainer = document.createElement("div");
    editorContainer.className = "editor-container";
    Object.assign(editorContainer.style, {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    });

    // Hidden textarea for Markdown storage
    this.markdownTextarea = document.createElement("textarea");
    this.markdownTextarea.style.display = "none";

    // Content-editable div for user interactions
    this.preview = document.createElement("div");
    this.preview.className = "preview-content";
    this.preview.contentEditable = true;
    this.preview.spellcheck = true;
    this.preview.placeholder = "Start typing...";
    Object.assign(this.preview.style, {
      flexGrow: 1,
      padding: '10px',
      outline: 'none'
    });

    editorContainer.appendChild(this.markdownTextarea);
    editorContainer.appendChild(this.preview);
    this.container.appendChild(editorContainer);

    this.addPreviewListeners();
    this.ensureInitialContent();
  }

  // Add listeners for user input in the preview
  addPreviewListeners() {
    this.preview.addEventListener("input", () => {
      try {
        this.updateMarkdownFromPreview();
      } catch (error) {
        console.error("Error updating Markdown from Preview:", error);
      }
    });

    this.markdownTextarea.addEventListener("input", () => {
      try {
        this.preview.innerHTML = this.markdownToHtml(this.markdownTextarea.value);
      } catch (error) {
        console.error("Error updating Preview from Markdown:", error);
      }
    });

    this.preview.addEventListener("keydown", (e) => {
      this.handlePreviewKeydown(e);
    });

    this.preview.addEventListener("paste", (e) => {
      e.preventDefault();
      try {
        const text = e.clipboardData.getData("text/plain");
        if (text) {
          document.execCommand("insertText", false, text);
        }
      } catch (error) {
        console.error("Error handling paste:", error);
      }
    });

    // Add context menu handling
    this.preview.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      
      const selection = window.getSelection();
      const cell = selection.focusNode instanceof Element ? 
        selection.focusNode.closest("td, th") : 
        selection.focusNode?.parentElement?.closest("td, th");

      // Create context menu
      const menu = document.createElement("div");
      menu.className = "editor-context-menu";
      menu.style.position = "fixed";
      menu.style.left = `${e.pageX}px`;
      menu.style.top = `${e.pageY}px`;
      menu.style.zIndex = "1000";
      menu.style.backgroundColor = "#fff";
      menu.style.border = "1px solid #ccc";
      menu.style.boxShadow = "2px 2px 5px rgba(0,0,0,0.2)";
      menu.style.padding = "5px 0";

      if (cell) {
        // Table-specific options
        const options = [
          { text: "Insert Row Above", action: () => this.insertRow(cell, "above") },
          { text: "Insert Row Below", action: () => this.insertRow(cell, "below") },
          { text: "Insert Column Left", action: () => this.insertColumn(cell, "left") },
          { text: "Insert Column Right", action: () => this.insertColumn(cell, "right") },
          { text: "Delete Row", action: () => this.deleteRow(cell) },
          { text: "Delete Column", action: () => this.deleteColumn(cell) },
          { text: "Merge All Cells in Row", action: () => this.mergeRowCells(cell) }
        ];

        options.forEach(({ text, action }) => {
          const option = document.createElement("div");
          option.textContent = text;
          option.style.padding = "5px 20px";
          option.style.cursor = "pointer";
          option.style.userSelect = "none";
          option.addEventListener("mouseenter", () => {
            option.style.backgroundColor = "#f0f0f0";
          });
          option.addEventListener("mouseleave", () => {
            option.style.backgroundColor = "transparent";
          });
          option.addEventListener("click", () => {
            action();
            menu.remove();
            this.updateMarkdownFromPreview();
          });
          menu.appendChild(option);
        });
      } else {
        // Regular text options
        const options = [
          { text: "Copy", action: () => this.handleCopy() },
          { text: "Cut", action: () => this.handleCut() },
          { text: "Paste", action: () => this.handlePaste() },
          { text: "Insert Table", action: () => this.insertTable() }
        ];

        options.forEach(({ text, action }) => {
          const option = document.createElement("div");
          option.textContent = text;
          option.style.padding = "5px 20px";
          option.style.cursor = "pointer";
          option.style.userSelect = "none";
          option.addEventListener("mouseenter", () => {
            option.style.backgroundColor = "#f0f0f0";
          });
          option.addEventListener("mouseleave", () => {
            option.style.backgroundColor = "transparent";
          });
          option.addEventListener("click", () => {
            action();
            menu.remove();
          });
          menu.appendChild(option);
        });
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
    });
  }

  // Merge all cells in a row
  mergeRowCells(cell) {
    const row = cell.parentElement;
    const cells = Array.from(row.cells);
    
    // Skip if only one cell
    if (cells.length <= 1) return;
    
    // Use first cell as target
    const targetCell = cells[0];
    
    // Combine content from all cells
    const combinedContent = cells.map(cell => cell.innerHTML.trim())
                                .filter(content => content !== '<br>' && content !== '')
                                .join(' ');
    
    targetCell.innerHTML = combinedContent || '<br>';
    targetCell.colSpan = cells.reduce((span, cell) => span + (cell.colSpan || 1), 0);
    
    // Remove other cells
    for (let i = cells.length - 1; i > 0; i--) {
      cells[i].remove();
    }
    
    this.updateMarkdownFromPreview();
  }

  // Ensure initial paragraph and focus setup
  ensureInitialContent() {
    const initialParagraph = document.createElement("p");
    initialParagraph.innerHTML = "<br>";
    this.preview.appendChild(initialParagraph);

    requestAnimationFrame(() => {
      this.preview.focus();
      const range = document.createRange();
      range.selectNodeContents(initialParagraph);
      range.collapse(true);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
  }

  // Update Markdown from Preview content
  updateMarkdownFromPreview() {
    if (!this.preview.innerHTML) {
      this.markdownTextarea.value = ""; // Handle empty preview gracefully
      return;
    }
    try {
      const markdown = this.htmlToMarkdown(this.preview.innerHTML);
      this.markdownTextarea.value = markdown;
    } catch (error) {
      console.error("Error converting HTML to Markdown:", error);
      this.markdownTextarea.value = ""; // Fallback to an empty Markdown value
    }
  }

  // Handle keydown events for table navigation and editing
  handlePreviewKeydown(e) {
    const selection = window.getSelection();
    // Get the actual Element from the Node
    const cell = selection.focusNode instanceof Element ? 
      selection.focusNode.closest("td, th") : 
      selection.focusNode?.parentElement?.closest("td, th");
    if (!cell) return;

    if (e.key === "Tab") {
      e.preventDefault();
      this.navigateTable(cell, e.shiftKey ? "backward" : "forward");
    }
  }

  // Navigate within table cells
  navigateTable(cell, direction) {
    const row = cell.parentElement;
    const table = row.parentElement.closest("table");
    const cells = Array.from(row.cells);
    const cellIndex = cells.indexOf(cell);

    let nextCell;
    if (direction === "forward") {
      if (cellIndex === cells.length - 1) {
        const nextRow = row.nextElementSibling;
        nextCell = nextRow ? nextRow.cells[0] : null;
      } else {
        nextCell = cells[cellIndex + 1];
      }
    } else {
      if (cellIndex === 0) {
        const prevRow = row.previousElementSibling;
        nextCell = prevRow ? prevRow.cells[prevRow.cells.length - 1] : null;
      } else {
        nextCell = cells[cellIndex - 1];
      }
    }

    if (nextCell) {
      nextCell.focus();
    }
  }

  // Convert Markdown to HTML
  markdownToHtml(markdown) {
    const lines = markdown.split("\n");
    let html = "";
    let inTable = false;
    let isHeader = true;
    let skipNextLine = false;

    lines.forEach((line, index) => {
      // Skip separator line
      if (skipNextLine) {
        skipNextLine = false;
        return;
      }

      if (line.startsWith("#")) {
        const level = line.match(/^#+/)[0].length;
        html += `<h${level}>${line.slice(level).trim()}</h${level}>\n`;
      } else if (line.trim().startsWith("|")) {
        const cells = line
          .trim()
          .split("|")
          .filter(Boolean)
          .map(cell => cell.trim());

        if (!inTable) {
          html += "<table>\n";
          inTable = true;
          isHeader = true;
        }

        // Check if next line is separator
        const nextLine = lines[index + 1];
        const isSeparator = nextLine && nextLine.includes("---");
        
        html += "<tr>";
        cells.forEach(cell => {
          const tag = isHeader ? "th" : "td";
          html += `<${tag}>${cell}</${tag}>`;
        });
        html += "</tr>\n";

        if (isSeparator) {
          skipNextLine = true;
          isHeader = false;
        }
      } else {
        if (inTable) {
          html += "</table>\n";
          inTable = false;
          isHeader = true;
        }
        if (line.trim()) {
          html += `<p>${line.trim()}</p>\n`;
        }
      }
    });

    if (inTable) {
      html += "</table>\n";
    }

    return html;
  }

  // Convert HTML to Markdown
  htmlToMarkdown(html) {
    if (!html) return ""; // Early return for empty input

    const div = document.createElement("div");
    div.innerHTML = html;
    let markdown = "";

    const processNode = (node) => {
      if (!node) return ""; // Skip invalid nodes

      switch (node.nodeType) {
        case Node.TEXT_NODE:
          return node.textContent.trim();

        case Node.ELEMENT_NODE:
          const tag = node.tagName.toLowerCase();
          const childContent = Array.from(node.childNodes)
            .map(child => processNode(child))
            .join("");

          switch (tag) {
            case "h1": return `# ${childContent}\n\n`;
            case "h2": return `## ${childContent}\n\n`;
            case "h3": return `### ${childContent}\n\n`;
            case "h4": return `#### ${childContent}\n\n`;
            case "h5": return `##### ${childContent}\n\n`;
            case "h6": return `###### ${childContent}\n\n`;
            case "p": return childContent ? `${childContent}\n\n` : "";
            case "table":
              let tableMarkdown = "\n";
              const rows = Array.from(node.rows);
              
              // Process header row
              if (rows.length > 0) {
                const headerCells = Array.from(rows[0].cells);
                tableMarkdown += "| " + headerCells.map(cell => processNode(cell).trim()).join(" | ") + " |\n";
                tableMarkdown += "|" + headerCells.map(() => " --- ").join("|") + "|\n";
                
                // Process data rows
                rows.slice(1).forEach(row => {
                  const cells = Array.from(row.cells);
                  tableMarkdown += "| " + cells.map(cell => processNode(cell).trim()).join(" | ") + " |\n";
                });
              }
              return tableMarkdown + "\n";
            case "tr": case "td": case "th":
              return childContent;
            default:
              return childContent;
          }
      }
      return "";
    };

    try {
      markdown = processNode(div);
    } catch (error) {
      console.error("Error processing HTML to Markdown:", error);
      return "";
    }

    return markdown.trim();
  }

  setText(markdown) {
    this.markdownTextarea.value = markdown;
    this.preview.innerHTML = this.markdownToHtml(markdown);
  }

  getText() {
    return this.markdownTextarea.value || "";
  }

  // Table manipulation methods
  insertRow(cell, position) {
    const row = cell.parentElement;
    const newRow = document.createElement("tr");
    const cellCount = row.cells.length;

    for (let i = 0; i < cellCount; i++) {
      const newCell = document.createElement("td");
      newCell.innerHTML = "<br>";
      newRow.appendChild(newCell);
    }

    if (position === "above") {
      row.parentNode.insertBefore(newRow, row);
    } else {
      row.parentNode.insertBefore(newRow, row.nextSibling);
    }
    this.updateMarkdownFromPreview();
  }

  insertColumn(cell, position) {
    const table = cell.closest("table");
    const cellIndex = cell.cellIndex;
    
    Array.from(table.rows).forEach((row, rowIndex) => {
      const newCell = document.createElement(rowIndex === 0 ? "th" : "td");
      newCell.innerHTML = "<br>";
      
      if (position === "left") {
        row.insertBefore(newCell, row.cells[cellIndex]);
      } else {
        row.insertBefore(newCell, row.cells[cellIndex + 1]);
      }
    });
    this.updateMarkdownFromPreview();
  }

  deleteRow(cell) {
    const row = cell.parentElement;
    if (row.parentElement.rows.length > 1) { // Prevent deleting the last row
      row.remove();
      this.updateMarkdownFromPreview();
    }
  }

  deleteColumn(cell) {
    const table = cell.closest("table");
    const cellIndex = cell.cellIndex;
    
    if (table.rows[0].cells.length > 1) { // Prevent deleting the last column
      Array.from(table.rows).forEach(row => {
        row.deleteCell(cellIndex);
      });
      this.updateMarkdownFromPreview();
    }
  }

  // Handle clipboard operations with markdown support
  async handleCopy() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());
    
    // Convert selected HTML to markdown
    const markdown = this.htmlToMarkdown(container.innerHTML);
    
    try {
      await navigator.clipboard.writeText(markdown);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }

  async handleCut() {
    await this.handleCopy();
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.deleteContents();
    this.updateMarkdownFromPreview();
  }

  async handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      const html = this.markdownToHtml(text);
      
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      
      const container = document.createElement('div');
      container.innerHTML = html;
      
      range.deleteContents();
      
      // Insert each child node
      while (container.firstChild) {
        range.insertNode(container.firstChild);
      }
      
      this.updateMarkdownFromPreview();
    } catch (error) {
      console.error('Failed to paste text:', error);
    }
  }

  // Insert a table at the current cursor position
  insertTable(rows = 3, cols = 3) {
    const table = document.createElement('table');
    
    for (let i = 0; i < rows; i++) {
      const row = document.createElement('tr');
      for (let j = 0; j < cols; j++) {
        const cell = document.createElement(i === 0 ? 'th' : 'td');
        cell.innerHTML = '<br>'; // Ensure cell is selectable
        row.appendChild(cell);
      }
      table.appendChild(row);
    }

    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // Insert table and ensure proper paragraph spacing
    const container = document.createElement('div');
    container.appendChild(table);
    container.innerHTML += '<p><br></p>'; // Add empty paragraph after table
    
    range.deleteContents();
    range.insertNode(container);
    
    // Focus first cell
    const firstCell = table.querySelector('th, td');
    if (firstCell) {
      firstCell.focus();
    }

    this.updateMarkdownFromPreview();
  }

  // Apply heading style to current line
  applyHeading(level) {
    if (level < 1 || level > 6) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    // Get the current line's block element
    let node = selection.focusNode;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    // Find the current block element
    let currentBlock = node;
    while (currentBlock && 
           !['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'].includes(currentBlock.tagName.toLowerCase()) &&
           currentBlock !== this.preview) {
      currentBlock = currentBlock.parentElement;
    }

    // If we hit the preview div or didn't find a block, wrap current selection
    if (!currentBlock || currentBlock === this.preview) {
      const range = selection.getRangeAt(0);
      const heading = document.createElement(`h${level}`);
      
      // If range is collapsed (cursor only), create empty heading
      if (range.collapsed) {
        heading.innerHTML = '<br>';
      } else {
        // Wrap selected content
        heading.appendChild(range.extractContents());
      }
      
      range.insertNode(heading);
      
      // Place cursor at end of heading
      const newRange = document.createRange();
      newRange.selectNodeContents(heading);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // Convert existing block to heading
      const heading = document.createElement(`h${level}`);
      heading.innerHTML = currentBlock.innerHTML || '<br>';
      currentBlock.parentNode.replaceChild(heading, currentBlock);
      
      // Restore cursor position
      const range = document.createRange();
      range.selectNodeContents(heading);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    this.updateMarkdownFromPreview();
  }

  // Apply font style to selection
  applyFont(fontName) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontFamily = fontName === 'courier' ? 'Courier New, monospace' : 'inherit';
    
    // If selection is empty, create placeholder
    if (range.collapsed) {
      span.innerHTML = '<br>';
      range.insertNode(span);
      
      // Place cursor in span
      const newRange = document.createRange();
      newRange.setStart(span, 0);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // Wrap selected content
      span.appendChild(range.extractContents());
      range.insertNode(span);
    }
    
    this.updateMarkdownFromPreview();
  }

  // For compatibility with EditorModal
  get editor() {
    return this;
  }

  // Focus the editor
  focus() {
    if (this.isMarkdownView) {
      this.markdownTextarea.focus();
    } else {
      this.preview.focus();
    }
    
    // Place cursor at the end if there's no selection
    const selection = window.getSelection();
    if (!selection.rangeCount) {
      const range = document.createRange();
      range.selectNodeContents(this.preview);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
}
