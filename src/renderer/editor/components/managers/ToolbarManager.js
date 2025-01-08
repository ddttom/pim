export class ToolbarManager {
    constructor(editor) {
        this.editor = editor;
        if (!this.editor) {
            console.error('Editor not initialized');
        }
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'editor-toolbar';

        // Add components
        toolbar.appendChild(this.createTitleGroup());
        toolbar.appendChild(this.createHeadingGroup());
        toolbar.appendChild(this.createFontGroup());
        toolbar.appendChild(this.createViewGroup());

        return toolbar;
    }

    createTitleGroup() {
        const group = document.createElement('div');
        group.className = 'toolbar-group';

        const titleBtn = document.createElement('button');
        titleBtn.textContent = 'Title';
        titleBtn.className = 'toolbar-btn';
        titleBtn.onclick = () => {
            if (this.editor?.editor?.preview) {
                // Save current selection
                const savedSelection = window.getSelection().getRangeAt(0).cloneRange();
                // Move cursor to start
                const range = document.createRange();
                range.setStart(this.editor.editor.preview, 0);
                range.collapse(true);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                // Insert title
                this.editor.editor.applyHeading(1);
                // Restore previous selection
                selection.removeAllRanges();
                selection.addRange(savedSelection);
            }
        };
        group.appendChild(titleBtn);

        return group;
    }

    createHeadingGroup() {
        const group = document.createElement('div');
        group.className = 'toolbar-group';

        // Add "No Heading" button first
        const noHeadingBtn = document.createElement('button');
        noHeadingBtn.textContent = 'No Heading';
        noHeadingBtn.className = 'toolbar-btn';
        noHeadingBtn.onclick = () => {
            if (this.editor?.editor?.preview) {
                const selection = window.getSelection();
                if (!selection.rangeCount) return;

                // Get current block element
                let node = selection.focusNode;
                if (node.nodeType === Node.TEXT_NODE) {
                    node = node.parentElement;
                }

                // Find current heading if any
                let currentHeading = node;
                while (currentHeading && 
                       !['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(currentHeading.tagName?.toLowerCase()) &&
                       currentHeading !== this.editor.editor.preview) {
                    currentHeading = currentHeading.parentElement;
                }

                // If found heading, convert to paragraph
                if (currentHeading && currentHeading !== this.editor.editor.preview) {
                    const p = document.createElement('p');
                    p.setAttribute('dir', 'ltr');
                    p.style.direction = 'ltr';
                    p.style.unicodeBidi = 'isolate';
                    p.innerHTML = currentHeading.innerHTML;
                    currentHeading.parentNode.replaceChild(p, currentHeading);

                    // Clean content and update markdown
                    const cleanHtml = this.editor.editor.cleanContent(this.editor.editor.preview.innerHTML);
                    this.editor.editor.preview.innerHTML = cleanHtml;
                    const markdown = this.editor.editor.converter.toMarkdown(cleanHtml);
                    this.editor.editor.markdownTextarea.value = markdown || '';
                }
            }
        };
        group.appendChild(noHeadingBtn);

        // Add heading buttons
        ['H1', 'H2', 'H3', 'H4', 'H5'].forEach(h => {
            const btn = document.createElement('button');
            btn.textContent = h;
            btn.className = 'toolbar-btn';
            btn.onclick = () => {
                if (this.editor?.editor) {
                    this.editor.editor.applyHeading(parseInt(h.slice(1)));
                }
            };
            group.appendChild(btn);
        });

        return group;
    }

    createFontGroup() {
        const group = document.createElement('div');
        group.className = 'toolbar-group';
        
        const fontSelect = document.createElement('select');
        fontSelect.className = 'toolbar-select';
        fontSelect.innerHTML = `
            <option value="normal">Normal</option>
            <option value="courier">Courier</option>
        `;
        fontSelect.onchange = (e) => this.editor?.editor?.applyFont(e.target.value);
        group.appendChild(fontSelect);

        return group;
    }

    createViewGroup() {
        const group = document.createElement('div');
        group.className = 'toolbar-group';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'toolbar-btn';
        viewBtn.textContent = 'Viewing Text';
        viewBtn.onclick = () => {
            const isMarkdownView = viewBtn.textContent === 'Viewing Text';
            viewBtn.textContent = isMarkdownView ? 'Viewing Markdown' : 'Viewing Text';
            viewBtn.style.backgroundColor = isMarkdownView ? '#e6f3ff' : '#f0f0f0';
            viewBtn.style.borderColor = isMarkdownView ? '#99ccff' : '#ccc';
            this.editor?.editor?.toggleView();
        };
        viewBtn.style.backgroundColor = '#f0f0f0';
        viewBtn.style.borderColor = '#ccc';
        group.appendChild(viewBtn);

        return group;
    }
}
