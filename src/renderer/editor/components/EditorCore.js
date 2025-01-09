 // Handles core editor functionality
export class EditorCore {
  constructor(container, converter) {
    this.container = container;
    this.markdownTextarea = null;
    this.preview = null;
    this.isMarkdownView = false;
    this.converter = converter;
    this.editor = null;
    this.toolbar = null;
  }

  setEditor(editor) {
    this.editor = editor;
  }

  setToolbar(toolbar) {
    this.toolbar = toolbar;
  }

  // Initialize editor
  init() {
    // Set container properties
    this.container.className = "editor-container";
    this.container.setAttribute('dir', 'ltr');
    Object.assign(this.container.style, {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      direction: 'ltr',
      unicodeBidi: 'isolate'
    });

    // Create markdown textarea with proper text direction
    this.markdownTextarea = document.createElement("textarea");
    this.markdownTextarea.value = '';
    this.markdownTextarea.setAttribute('dir', 'ltr');
    this.markdownTextarea.setAttribute('wrap', 'off');
    this.markdownTextarea.setAttribute('spellcheck', 'false');
    Object.assign(this.markdownTextarea.style, {
      display: 'none',
      width: '100%',
      height: '100%',
      fontFamily: 'monospace',
      padding: '10px',
      border: 'none',
      resize: 'none',
      outline: 'none',
      direction: 'ltr',
      unicodeBidi: 'plaintext',
      whiteSpace: 'pre',
      overflowWrap: 'normal'
    });

    // Add input handler for markdown textarea
    this.markdownTextarea.addEventListener('input', (e) => {
      const text = e.target.value;
      console.log('Markdown Input - Original:', text);
      
      // Convert to HTML and update preview
      const html = this.converter.toHtml(text);
      const cleanHtml = html ? this.cleanContent(html) : '<p><br></p>';
      
      // Update preview and store valid content
      this.preview.innerHTML = cleanHtml;
      if (cleanHtml && cleanHtml !== '<p><br></p>') {
        this.converter.storeValidContent(cleanHtml, 'html');
        this.converter.storeValidContent(text, 'markdown');
      }
    });

    // Create editor wrapper div
    const editorWrapper = document.createElement("div");
    editorWrapper.className = "editor-wrapper";
    Object.assign(editorWrapper.style, {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      direction: 'ltr',
      unicodeBidi: 'isolate'
    });

    // Create preview div
    this.preview = document.createElement("div");
    this.preview.className = "preview-content";
    this.preview.contentEditable = true;
    this.preview.spellcheck = true;
    this.preview.placeholder = "Start typing...";
    this.preview.setAttribute('data-gramm', 'false'); // Disable Grammarly
    this.preview.setAttribute('dir', 'ltr');
    Object.assign(this.preview.style, {
      flexGrow: 1,
      padding: '10px',
      outline: 'none',
      display: 'block',
      direction: 'ltr',
      unicodeBidi: 'isolate'
    });

    // Add elements to wrapper
    editorWrapper.appendChild(this.markdownTextarea);
    editorWrapper.appendChild(this.preview);

    // Add wrapper to container
    this.container.appendChild(editorWrapper);

    // Add input event listener for proper text handling
    this.preview.addEventListener('input', (e) => {
      // Get selection and range
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      
      // Store cursor position
      const offset = range.startOffset;
      const container = range.startContainer;
      
      // Get current block element
      let currentBlock = container;
      if (currentBlock.nodeType === Node.TEXT_NODE) {
        currentBlock = currentBlock.parentElement;
      }
      while (currentBlock && currentBlock !== this.preview) {
        if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'].includes(currentBlock.tagName?.toLowerCase())) {
          // If we found a block but it's not a direct child of preview, keep going up
          if (currentBlock.parentNode !== this.preview) {
            currentBlock = currentBlock.parentNode;
            continue;
          }
          break; // Found a valid root-level block
        }
        currentBlock = currentBlock.parentElement;
      }
      
      // If no block found, wrap content in paragraph
      if (!currentBlock || currentBlock === this.preview) {
        const p = document.createElement('p');
        p.setAttribute('dir', 'ltr');
        p.style.direction = 'ltr';
        p.style.unicodeBidi = 'isolate';
        
        // Move content into paragraph
        const content = this.preview.childNodes;
        while (content.length > 0) {
          p.appendChild(content[0]);
        }
        this.preview.appendChild(p);
        currentBlock = p;
      }
      
      // Handle text input and synchronization
      if (container.nodeType === Node.TEXT_NODE) {
        console.log('Input - Original text:', container.textContent);
        
        // Clean content
        const cleanHtml = this.cleanContent(this.preview.innerHTML);
        console.log('Clean HTML:', cleanHtml);
        this.preview.innerHTML = cleanHtml;
        
        // Convert to markdown and sync
        const markdown = this.converter.toMarkdown(cleanHtml);
        console.log('Converted Markdown:', markdown);
        
        // Update markdown and store valid content
        this.markdownTextarea.value = markdown || '';
        if (cleanHtml && cleanHtml !== '<p><br></p>') {
          this.converter.storeValidContent(cleanHtml, 'html');
          this.converter.storeValidContent(markdown, 'markdown');
        }
      }
      
      // Find and restore cursor position
      if (container) {
        // Find the text node that matches our content
        const walk = document.createTreeWalker(
          this.preview,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        
        let node;
        let found = false;
        while (node = walk.nextNode()) {
          if (node.textContent === container.textContent) {
            // Found matching text node
            const newRange = document.createRange();
            newRange.setStart(node, Math.min(offset, node.length));
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            found = true;
            break;
          }
        }
        
        // If not found, place cursor at end of last text node
        if (!found && this.preview.lastChild) {
          // Find last text node
          let lastTextNode = null;
          let node;
          while (node = walk.nextNode()) {
            lastTextNode = node;
          }
          
          if (lastTextNode) {
            const newRange = document.createRange();
            newRange.setStart(lastTextNode, lastTextNode.length);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      }
    });


    // Initialize with empty content
    const emptyHtml = '<p dir="ltr" style="direction:ltr;unicode-bidi:isolate"><br></p>';
    const emptyMarkdown = '';
    
    // Store initial state in converter
    this.converter.storeValidContent(emptyHtml, 'html');
    this.converter.storeValidContent(emptyMarkdown, 'markdown');
    
    // Set initial content
    this.preview.innerHTML = emptyHtml;
    this.markdownTextarea.value = emptyMarkdown;
    
    this.focus();
  }

  // Toggle between markdown and preview views
  toggleView() {
    const wasMarkdownView = this.isMarkdownView;
    
    // Store current content before any changes
    const currentContent = wasMarkdownView ? 
      this.markdownTextarea.value : 
      this.preview.innerHTML;
    
    // Convert content first
    if (!wasMarkdownView) {
      // Going from preview to markdown
      // Going from preview to markdown
      const cleanContent = this.cleanContent(currentContent);
      console.log('Toggle View - Clean HTML:', cleanContent);
      
      const markdown = this.converter.toMarkdown(cleanContent);
      console.log('Toggle View - Converted Markdown:', markdown);
      
      // Always use the converted markdown if available
      if (markdown) {
        this.markdownTextarea.value = markdown;
        // Store valid content
        if (cleanContent && cleanContent !== '<p><br></p>') {
          this.converter.storeValidContent(cleanContent, 'html');
          this.converter.storeValidContent(markdown, 'markdown');
        }
      } else {
        // Fallback to last valid content or raw text
        const lastValidMarkdown = this.converter.getLastValidContent('markdown');
        const rawText = cleanContent.replace(/<[^>]*>/g, '').trim();
        this.markdownTextarea.value = lastValidMarkdown || rawText || '';
      }
    } else {
      // Going from markdown to preview
      // Convert markdown to HTML
      const html = this.converter.toHtml(currentContent || '');
      const cleanHtml = html ? this.cleanContent(html) : '<p><br></p>';
      
    // Store valid content
    if (cleanHtml && cleanHtml !== '<p><br></p>') {
      this.converter.storeValidContent(this.preview.innerHTML, 'html');
        this.converter.storeValidContent(currentContent, 'markdown');
      }
      
      // Update preview
      this.preview.innerHTML = cleanHtml;
    }

    // Update display state
    if (!wasMarkdownView) {
      // Switch to markdown view
      this.preview.style.display = 'none';
      this.markdownTextarea.style.display = 'block';
    } else {
      // Switch to preview view
      this.markdownTextarea.style.display = 'none';
      this.preview.style.display = 'block';
    }

    // Update state and focus
    this.isMarkdownView = !wasMarkdownView;
    
    // Notify toolbar manager through editor
    if (this.editor?.toolbar) {
      this.editor.toolbar.updateButtonsState(this.isMarkdownView);
    }
    
    // Focus appropriate element
    if (this.isMarkdownView) {
      this.markdownTextarea.focus();
      const length = this.markdownTextarea.value.length;
      this.markdownTextarea.setSelectionRange(length, length);
    } else {
      this.preview.focus();
    }
  }

  // Clean HTML content by removing duplicates
  cleanContent(html) {
    if (!html) return '<p><br></p>';

    console.log('Clean Content - Input HTML:', html);
    const div = document.createElement('div');
    div.setAttribute('dir', 'ltr');
    div.style.direction = 'ltr';
    div.style.unicodeBidi = 'isolate';
    div.innerHTML = html;
    console.log('Clean Content - Parsed DOM:', div.innerHTML);

    // Ensure block-level wrapper for inline content
    if (!div.children.length && div.textContent) {
      const p = document.createElement('p');
      p.setAttribute('dir', 'ltr');
      p.style.direction = 'ltr';
      p.style.unicodeBidi = 'isolate';
      p.innerHTML = div.innerHTML;
      div.innerHTML = '';
      div.appendChild(p);
    }

    // Remove duplicates while preserving order
    const uniqueBlocks = Array.from(div.children).filter((el, index, arr) => {
      const key = el.outerHTML;
      return !arr.slice(0, index).some(prev => prev.outerHTML === key);
    });

    // Ensure at least one block
    if (!uniqueBlocks.length) {
      return '<p dir="ltr" style="direction:ltr;unicode-bidi:isolate"><br></p>';
    }

    // Rebuild content
    const result = uniqueBlocks.map(el => el.outerHTML).join('');
    console.log('Clean Content - Final Result:', result);
    return result;
  }

  // Apply heading style to current line
  applyHeading(level) {
    if (level < 0 || level > 6) return;

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    
    // Get the current block element
    let currentBlock = range.commonAncestorContainer;
    if (currentBlock.nodeType === Node.TEXT_NODE) {
      currentBlock = currentBlock.parentElement;
    }
    while (currentBlock && currentBlock !== this.preview && 
           !['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(currentBlock.tagName?.toLowerCase())) {
      currentBlock = currentBlock.parentElement;
    }

    // If line is blank, do nothing
    if (range.collapsed && (!currentBlock || !currentBlock.textContent.trim())) {
      return;
    }

    // Get target block - either current block or create new paragraph
    let targetBlock = currentBlock;
    if (!targetBlock || targetBlock === this.preview) {
      targetBlock = document.createElement('p');
      targetBlock.setAttribute('dir', 'ltr');
      targetBlock.style.direction = 'ltr';
      targetBlock.style.unicodeBidi = 'isolate';
      range.surroundContents(targetBlock);
    }

    // If current block is already the target type, do nothing
    const targetTag = level === 0 ? 'p' : `h${level}`;
    if (targetBlock.tagName?.toLowerCase() === targetTag) {
      return;
    }

    // Create new element
    const newElement = document.createElement(targetTag);
    newElement.setAttribute('dir', 'ltr');
    newElement.style.direction = 'ltr';
    newElement.style.unicodeBidi = 'isolate';

    // Move content to new element
    while (targetBlock.firstChild) {
      newElement.appendChild(targetBlock.firstChild);
    }

    // Replace old block with new element
    targetBlock.parentNode.replaceChild(newElement, targetBlock);
    
    // Clean content after modification
    const cleanHtml = this.cleanContent(this.preview.innerHTML);
    this.preview.innerHTML = cleanHtml;
    
    // Place cursor at end of block
    const updatedBlock = level === 0 ? 
      this.preview.querySelector('p:last-of-type') :
      this.preview.querySelector(`h${level}`);
    if (updatedBlock) {
      const newRange = document.createRange();
      newRange.selectNodeContents(updatedBlock);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }

    // Convert and sync content
    const markdown = this.converter.toMarkdown(this.preview.innerHTML);
    this.markdownTextarea.value = markdown || '';
    
    // Store valid content
    if (this.preview.innerHTML && this.preview.innerHTML !== '<p><br></p>') {
      this.converter.storeValidContent(this.preview.innerHTML, 'html');
      this.converter.storeValidContent(markdown, 'markdown');
    }
  }

  // Apply bold or italic style
  applyStyle(style) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const tag = style === 'bold' ? 'strong' : 'em';
    const element = document.createElement(tag);
    element.setAttribute('dir', 'ltr');
    element.style.direction = 'ltr';
    element.style.unicodeBidi = 'isolate';
    
    // If selection is empty, create placeholder
    if (range.collapsed) {
      element.innerHTML = '<br>';
      range.insertNode(element);
      
      // Clean content after modification
      const cleanHtml = this.cleanContent(this.preview.innerHTML);
      this.preview.innerHTML = cleanHtml;
      
      // Find the inserted element in cleaned content
      const elements = this.preview.querySelectorAll(tag);
      const newElement = elements[elements.length - 1];
      
      // Place cursor in element
      const newRange = document.createRange();
      newRange.setStart(newElement || this.preview.lastChild, 0);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      // Wrap selected content
      element.appendChild(range.extractContents());
      range.insertNode(element);
      
      // Clean content after modification
      const cleanHtml = this.cleanContent(this.preview.innerHTML);
      this.preview.innerHTML = cleanHtml;
      
      // Find the inserted element in cleaned content
      const elements = this.preview.querySelectorAll(tag);
      const newElement = elements[elements.length - 1];
      
      // Place cursor at end of element
      const newRange = document.createRange();
      newRange.selectNodeContents(newElement || this.preview.lastChild);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    
    // Convert and sync content
    const markdown = this.converter.toMarkdown(this.preview.innerHTML);
    this.markdownTextarea.value = markdown || '';
    
    // Store valid content
    if (this.preview.innerHTML && this.preview.innerHTML !== '<p><br></p>') {
      this.converter.storeValidContent(this.preview.innerHTML, 'html');
      this.converter.storeValidContent(markdown, 'markdown');
    }
  }

  // Apply font style to selection with content cleaning
  applyFont(fontName) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);

    if (fontName === 'normal') {
      // Get the current block element
      let currentBlock = range.commonAncestorContainer;
      if (currentBlock.nodeType === Node.TEXT_NODE) {
        currentBlock = currentBlock.parentElement;
      }
      while (currentBlock && currentBlock !== this.preview && 
             !['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(currentBlock.tagName?.toLowerCase())) {
        currentBlock = currentBlock.parentElement;
      }

      // If no block found, wrap in paragraph
      if (!currentBlock || currentBlock === this.preview) {
        const p = document.createElement('p');
        p.setAttribute('dir', 'ltr');
        p.style.direction = 'ltr';
        p.style.unicodeBidi = 'isolate';
        range.surroundContents(p);
        currentBlock = p;
      }

      // Extract selected content
      const content = range.extractContents();
      const text = content.textContent;

      // Create new paragraph with text
      const p = document.createElement('p');
      p.setAttribute('dir', 'ltr');
      p.style.direction = 'ltr';
      p.style.unicodeBidi = 'isolate';
      p.textContent = text;

      // Replace old block with new paragraph
      if (currentBlock && currentBlock !== this.preview) {
        currentBlock.parentNode.replaceChild(p, currentBlock);
      } else {
        range.insertNode(p);
      }

      // Place cursor at end of text
      const newRange = document.createRange();
      newRange.selectNodeContents(p);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);

      // Clean content after modification
      const cleanHtml = this.cleanContent(this.preview.innerHTML);
      this.preview.innerHTML = cleanHtml;

      // Convert and sync content
      const markdown = this.converter.toMarkdown(this.preview.innerHTML);
      this.markdownTextarea.value = markdown || '';
      
      // Store valid content
      if (this.preview.innerHTML && this.preview.innerHTML !== '<p><br></p>') {
        this.converter.storeValidContent(cleanHtml, 'html');
        this.converter.storeValidContent(markdown, 'markdown');
      }
    } else {
      // Apply courier font
      const span = document.createElement('span');
      span.style.fontFamily = 'Courier New, monospace';
      span.setAttribute('dir', 'ltr');
      span.style.direction = 'ltr';
      span.style.unicodeBidi = 'isolate';

      // If selection is empty, create placeholder
      if (range.collapsed) {
        span.innerHTML = '<br>';
        range.insertNode(span);
        
        // Clean content after modification
        const cleanHtml = this.cleanContent(this.preview.innerHTML);
        this.preview.innerHTML = cleanHtml;
        
        // Find the inserted span in cleaned content
        const spans = this.preview.querySelectorAll('span');
        const newSpan = Array.from(spans).find(s => 
          s.style.fontFamily === span.style.fontFamily);
        
        // Place cursor in span
        const newRange = document.createRange();
        newRange.setStart(newSpan || this.preview.lastChild, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        // Wrap selected content
        span.appendChild(range.extractContents());
        range.insertNode(span);
        
        // Clean content after modification
        const cleanHtml = this.cleanContent(this.preview.innerHTML);
        this.preview.innerHTML = cleanHtml;
        
        // Find the inserted span in cleaned content
        const spans = this.preview.querySelectorAll('span');
        const newSpan = Array.from(spans).find(s => 
          s.style.fontFamily === span.style.fontFamily);
        
        // Place cursor at end of span
        const newRange = document.createRange();
        newRange.selectNodeContents(newSpan || this.preview.lastChild);
        newRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }

      // Convert and sync content
      const markdown = this.converter.toMarkdown(this.preview.innerHTML);
      this.markdownTextarea.value = markdown || '';
      
      // Store valid content
      if (this.preview.innerHTML && this.preview.innerHTML !== '<p><br></p>') {
        this.converter.storeValidContent(this.preview.innerHTML, 'html');
        this.converter.storeValidContent(markdown, 'markdown');
      }
    }
  }

  // Focus the editor and place cursor appropriately
  focus() {
    if (this.isMarkdownView) {
      // Focus markdown textarea and place cursor at end
      this.markdownTextarea.focus();
      const length = this.markdownTextarea.value.length;
      this.markdownTextarea.setSelectionRange(length, length);
    } else {
      // Focus preview
      this.preview.focus();
      
      // Find appropriate place for cursor
      const selection = window.getSelection();
      const range = document.createRange();
      
      // Find last editable position
      let lastNode = this.preview.lastChild;
      while (lastNode && lastNode.nodeType !== Node.TEXT_NODE && !lastNode.innerHTML) {
        lastNode = lastNode.lastChild;
      }
      
      if (!lastNode) {
        // If no content, place in first paragraph with proper direction
        const firstP = this.preview.querySelector('p') || this.preview;
        if (firstP === this.preview) {
          const p = document.createElement('p');
          p.setAttribute('dir', 'ltr');
          p.style.direction = 'ltr';
          p.style.unicodeBidi = 'isolate';
          p.innerHTML = '<br>';
          this.preview.appendChild(p);
          range.selectNodeContents(p);
        } else {
          range.selectNodeContents(firstP);
        }
      } else if (lastNode.nodeType === Node.TEXT_NODE) {
        range.setStart(lastNode, lastNode.length);
      } else {
        range.selectNodeContents(lastNode);
      }
      
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  // Set text content with proper synchronization
  setText(markdown) {
    // Convert markdown to HTML
    const html = this.converter.toHtml(markdown || '');
    const cleanHtml = html ? this.cleanContent(html) : '<p><br></p>';
    
    // Update content with conversion or last valid content
    if (!cleanHtml || cleanHtml === '<p><br></p>') {
      const lastValidHtml = this.converter.getLastValidContent('html');
      const lastValidMarkdown = this.converter.getLastValidContent('markdown');
      
      if (lastValidHtml && lastValidMarkdown) {
        this.preview.innerHTML = lastValidHtml;
        this.markdownTextarea.value = lastValidMarkdown;
      } else {
        this.preview.innerHTML = cleanHtml;
        this.markdownTextarea.value = markdown || '';
      }
    } else {
      this.preview.innerHTML = cleanHtml;
      this.markdownTextarea.value = markdown || '';
      
      // Store valid content
      this.converter.storeValidContent(cleanHtml, 'html');
      this.converter.storeValidContent(markdown, 'markdown');
    }
    
    // Update display based on current view
    if (this.isMarkdownView) {
      this.preview.style.display = 'none';
      this.markdownTextarea.style.display = 'block';
    } else {
      this.markdownTextarea.style.display = 'none';
      this.preview.style.display = 'block';
    }
  }

  // Insert table at current cursor position
  insertTable(rows, cols) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    // Create table HTML
    const table = document.createElement('table');
    table.setAttribute('dir', 'ltr');
    table.style.direction = 'ltr';
    table.style.unicodeBidi = 'isolate';

    // Create rows and cells
    for (let i = 0; i < rows; i++) {
      const row = document.createElement('tr');
      for (let j = 0; j < cols; j++) {
        const cell = document.createElement(i === 0 ? 'th' : 'td');
        cell.innerHTML = '<br>';
        row.appendChild(cell);
      }
      table.appendChild(row);
    }

    // Insert table at cursor
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(table);

    // Clean content after modification
    const cleanHtml = this.cleanContent(this.preview.innerHTML);
    this.preview.innerHTML = cleanHtml;

    // Convert and sync content
    const markdown = this.converter.toMarkdown(this.preview.innerHTML);
    this.markdownTextarea.value = markdown || '';
    
    // Store valid content
    if (this.preview.innerHTML && this.preview.innerHTML !== '<p><br></p>') {
      this.converter.storeValidContent(this.preview.innerHTML, 'html');
      this.converter.storeValidContent(markdown, 'markdown');
    }

    // Place cursor in first cell
    const newTable = this.preview.querySelector('table');
    if (newTable) {
      const firstCell = newTable.querySelector('th, td');
      if (firstCell) {
        range.selectNodeContents(firstCell);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  // Get text content with proper direction
  getText() {
    const text = this.markdownTextarea.value || "";
    
    // Normalize text direction before returning
    const tempSpan = document.createElement('span');
    tempSpan.setAttribute('dir', 'ltr');
    tempSpan.style.direction = 'ltr';
    tempSpan.style.unicodeBidi = 'plaintext';
    tempSpan.textContent = text;
    
    return tempSpan.textContent;
  }
}
