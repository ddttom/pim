export class TableManager {
    constructor(editor) {
        this.editor = editor;
        if (!this.editor) {
            console.error('Editor not initialized');
        }
    }

    createTableGroup() {
        const group = document.createElement('div');
        group.className = 'toolbar-group';

        const tableDropdown = this.createTableDropdown();
        group.appendChild(tableDropdown);

        return group;
    }

    createTableDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'table-dropdown';
        dropdown.style.position = 'relative';
        
        const tableBtn = document.createElement('button');
        tableBtn.className = 'toolbar-btn';
        tableBtn.textContent = 'Insert Table';

        const dropdownContent = this.createDropdownContent();
        
        // Handle button click
        tableBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdownContent.style.display = dropdownContent.style.display === 'none' ? 'block' : 'none';
        });

        // Add click outside handler
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdownContent.style.display = 'none';
            }
        });

        dropdown.appendChild(tableBtn);
        dropdown.appendChild(dropdownContent);

        return dropdown;
    }

    createDropdownContent() {
        const content = document.createElement('div');
        content.className = 'dropdown-content';
        content.style.display = 'none';
        content.style.position = 'absolute';
        content.style.backgroundColor = '#fff';
        content.style.border = '1px solid #ccc';
        content.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        content.style.zIndex = '1000';
        content.style.padding = '10px';
        content.style.top = '100%';
        content.style.left = '0';

        // Add size indicator
        const sizeIndicator = document.createElement('div');
        sizeIndicator.style.textAlign = 'center';
        sizeIndicator.style.marginBottom = '5px';
        sizeIndicator.style.color = '#666';
        sizeIndicator.textContent = '0 × 0';
        content.appendChild(sizeIndicator);

        // Create table grid
        const tableGrid = this.createTableGrid(sizeIndicator);
        content.appendChild(tableGrid);

        return content;
    }

    createTableGrid(sizeIndicator) {
        const grid = document.createElement('div');
        grid.className = 'table-grid';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(6, 20px)';
        grid.style.gap = '2px';
        grid.style.padding = '5px';

        // Setup grid cells
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                const cell = this.createGridCell(i + 1, j + 1, grid, sizeIndicator);
                grid.appendChild(cell);
            }
        }

        // Reset size indicator when leaving grid
        grid.addEventListener('mouseleave', () => {
            sizeIndicator.textContent = '0 × 0';
            const cells = grid.querySelectorAll('.grid-cell');
            cells.forEach(cell => {
                cell.style.backgroundColor = '#fff';
                cell.style.borderColor = '#ccc';
            });
        });

        return grid;
    }

    createGridCell(row, col, grid, sizeIndicator) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.style.width = '20px';
        cell.style.height = '20px';
        cell.style.border = '1px solid #ccc';
        cell.style.backgroundColor = '#fff';
        cell.style.cursor = 'pointer';

        // Handle hover
        cell.addEventListener('mouseenter', (e) => {
            const cells = grid.querySelectorAll('.grid-cell');
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

        // Handle click
        cell.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const rows = parseInt(e.target.dataset.row);
            const cols = parseInt(e.target.dataset.col);
            
            // Create table HTML
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.marginBottom = '1em';
            
            for (let i = 0; i < rows; i++) {
                const tr = document.createElement('tr');
                for (let j = 0; j < cols; j++) {
                    const td = document.createElement('td');
                    td.style.border = '1px solid #ccc';
                    td.style.padding = '8px';
                    td.innerHTML = '<br>';
                    tr.appendChild(td);
                }
                table.appendChild(tr);
            }
            
            // Insert table at cursor position
            if (this.editor?.editor?.preview) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.insertNode(table);
                    
                    // Move cursor after table
                    range.setStartAfter(table);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
            
            // Hide dropdown
            const dropdown = grid.closest('.dropdown-content');
            if (dropdown) {
                dropdown.style.display = 'none';
            }
            
            // Focus editor
            this.editor?.editor?.focus();
        });

        return cell;
    }
}
