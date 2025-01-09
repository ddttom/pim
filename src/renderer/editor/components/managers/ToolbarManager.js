export class ToolbarManager {
    constructor(editor) {
        this.editor = editor;
        if (!this.editor) {
            console.error('Editor not initialized');
        }
        this.buttons = new Set();
        
        // Set initial button states
        if (this.editor?.editor) {
            const isMarkdownView = this.editor.editor.isMarkdownView;
            setTimeout(() => this.updateButtonsState(isMarkdownView), 0);
        }
    }

    addButton(btn) {
        if (btn.dataset.role !== 'view-toggle') {
            btn.disabled = this.editor?.editor?.isMarkdownView || false;
            btn.style.opacity = btn.disabled ? '0.5' : '1';
            
            // For select elements, ensure all options except first are disabled
            if (btn.tagName === 'SELECT') {
                Array.from(btn.options).forEach((opt, i) => {
                    if (i === 0) return; // Skip first option (Style)
                    opt.disabled = btn.disabled;
                });
            }
        }
        this.buttons.add(btn);
        return btn;
    }

    updateButtonsState(isMarkdownView) {
        this.buttons.forEach(btn => {
            if (btn.dataset.role !== 'view-toggle') {
                btn.disabled = isMarkdownView;
                btn.style.opacity = isMarkdownView ? '0.5' : '1';
                
                // For select elements, ensure all options except first are disabled
                if (btn.tagName === 'SELECT') {
                    Array.from(btn.options).forEach((opt, i) => {
                        if (i === 0) return; // Skip first option (Style)
                        opt.disabled = isMarkdownView;
                    });
                }
            }
        });
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'editor-toolbar';

        // Add components
        toolbar.appendChild(this.createTitleGroup());
        toolbar.appendChild(this.createHeadingGroup());
        toolbar.appendChild(this.createFontGroup());
        toolbar.appendChild(this.createTableGroup());
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
            if (this.editor?.editor) {
                const selection = window.getSelection();
                if (!selection.rangeCount) return;
                const range = selection.getRangeAt(0);
                if (range.collapsed && !range.startContainer.textContent.trim()) return;
                this.editor.editor.applyHeading(1);
            }
        };
        group.appendChild(this.addButton(titleBtn));

        return group;
    }

    createHeadingGroup() {
        const group = document.createElement('div');
        group.className = 'toolbar-group';

        // Add "Remove Heading" button first
        const removeHeadingBtn = document.createElement('button');
        removeHeadingBtn.textContent = 'Remove Heading';
        removeHeadingBtn.className = 'toolbar-btn';
        removeHeadingBtn.onclick = () => {
            if (this.editor?.editor) {
                const selection = window.getSelection();
                if (!selection.rangeCount) return;
                const range = selection.getRangeAt(0);
                if (range.collapsed && !range.startContainer.textContent.trim()) return;
                this.editor.editor.applyHeading(0); // 0 means convert to paragraph
            }
        };
        group.appendChild(this.addButton(removeHeadingBtn));

        // Add heading buttons
        ['H1', 'H2', 'H3', 'H4', 'H5'].forEach(h => {
            const btn = document.createElement('button');
            btn.textContent = h;
            btn.className = 'toolbar-btn';
            btn.onclick = () => {
                if (this.editor?.editor) {
                    const selection = window.getSelection();
                    if (!selection.rangeCount) return;
                    const range = selection.getRangeAt(0);
                    if (range.collapsed && !range.startContainer.textContent.trim()) return;
                    this.editor.editor.applyHeading(parseInt(h.slice(1)));
                }
            };
            group.appendChild(this.addButton(btn));
        });

        return group;
    }

    createFontGroup() {
        const group = document.createElement('div');
        group.className = 'toolbar-group';
        
        const styleSelect = document.createElement('select');
        styleSelect.className = 'toolbar-select';
        styleSelect.innerHTML = `
            <option value="" disabled selected>Style</option>
            <option value="normal">Regular</option>
            <option value="courier">Monospace</option>
            <option value="bold">Bold</option>
            <option value="italic">Italic</option>
        `;
        styleSelect.onchange = (e) => {
            const value = e.target.value;
            if (!value) return;

            if (this.editor?.editor) {
                switch (value) {
                    case 'bold':
                        this.editor.editor.applyStyle('bold');
                        break;
                    case 'italic':
                        this.editor.editor.applyStyle('italic');
                        break;
                    default:
                        this.editor.editor.applyFont(value);
                }
            }
            
            // Reset select to placeholder
            setTimeout(() => styleSelect.value = '', 0);
        };
        group.appendChild(this.addButton(styleSelect));

        return group;
    }

    createTableGroup() {
        const group = document.createElement('div');
        group.className = 'toolbar-group';

        // Create dropdown container
        const dropdown = document.createElement('div');
        dropdown.className = 'table-dropdown';

        // Create table button
        const tableBtn = document.createElement('button');
        tableBtn.textContent = 'Insert Table';
        tableBtn.className = 'toolbar-btn';
        dropdown.appendChild(this.addButton(tableBtn));

        // Create dropdown content
        const dropdownContent = document.createElement('div');
        dropdownContent.className = 'dropdown-content';
        dropdownContent.style.display = 'none';
        dropdownContent.style.position = 'absolute';
        dropdownContent.style.backgroundColor = 'var(--background-color)';
        dropdownContent.style.border = '1px solid var(--border-color)';
        dropdownContent.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        dropdownContent.style.zIndex = '1000';
        dropdownContent.style.padding = '10px';
        dropdownContent.style.top = '100%';
        dropdownContent.style.left = '0';

        // Add size indicator
        const sizeIndicator = document.createElement('div');
        sizeIndicator.className = 'size-indicator';
        sizeIndicator.textContent = '0 × 0';
        dropdownContent.appendChild(sizeIndicator);

        // Create grid
        const grid = document.createElement('div');
        grid.className = 'table-grid';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(6, 20px)';
        grid.style.gap = '2px';
        grid.style.padding = '5px';

        // Create grid cells
        for (let row = 1; row <= 6; row++) {
            for (let col = 1; col <= 6; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.style.width = '20px';
                cell.style.height = '20px';
                cell.style.border = '1px solid var(--border-color)';
                cell.style.backgroundColor = 'var(--button-background)';
                cell.style.transition = 'background-color 0.15s ease';
                cell.style.cursor = 'pointer';
                grid.appendChild(cell);
            }
        }

        dropdownContent.appendChild(grid);
        dropdown.appendChild(dropdownContent);
        group.appendChild(dropdown);

        // Show/hide dropdown
        tableBtn.onclick = (e) => {
            if (!tableBtn.disabled) {
                e.stopPropagation(); // Prevent document click from immediately closing
                const isVisible = dropdownContent.style.display === 'block';
                dropdownContent.style.display = isVisible ? 'none' : 'block';
                if (!isVisible) {
                    sizeIndicator.textContent = '0 × 0';
                    updateHighlight(0, 0);
                }
            }
        };

        // Handle cell hover and highlighting
        let cells = grid.querySelectorAll('.grid-cell');
        const updateHighlight = (targetRow, targetCol) => {
            cells.forEach(c => {
                const r = parseInt(c.dataset.row);
                const c2 = parseInt(c.dataset.col);
                c.style.backgroundColor = (r <= targetRow && c2 <= targetCol) ? 'var(--button-hover-background)' : 'var(--button-background)';
            });
        };

        cells.forEach(cell => {
            cell.onmouseover = () => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                sizeIndicator.textContent = `${row} × ${col}`;
                updateHighlight(row, col);
            };

            cell.onmouseout = () => {
                updateHighlight(0, 0);
            };
            
            cell.onclick = () => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                if (this.editor?.editor) {
                    this.editor.editor.insertTable(row, col);
                }
                dropdownContent.style.display = 'none';
            };
        });

        // Handle hover states
        grid.onmouseenter = () => {
            updateHighlight(0, 0);
        };

        grid.onmouseleave = () => {
            sizeIndicator.textContent = '0 × 0';
            updateHighlight(0, 0);
        };

        dropdownContent.onmouseleave = () => {
            sizeIndicator.textContent = '0 × 0';
            updateHighlight(0, 0);
        };

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdownContent.style.display = 'none';
                sizeIndicator.textContent = '0 × 0';
                updateHighlight(0, 0);
            }
        });

        return group;
    }

    createViewGroup() {
        const group = document.createElement('div');
        group.className = 'toolbar-group';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'toolbar-btn';
        viewBtn.textContent = 'Viewing Text';
        viewBtn.dataset.role = 'view-toggle';
        viewBtn.onclick = () => {
            const isMarkdownView = viewBtn.textContent === 'Viewing Text';
            viewBtn.textContent = isMarkdownView ? 'Viewing Markdown' : 'Viewing Text';
            if (this.editor?.editor) {
                this.editor.editor.toggleView();
                this.updateButtonsState(isMarkdownView);
            }
        };
        group.appendChild(viewBtn);

        return group;
    }
}
