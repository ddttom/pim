// Handles table-related operations
export class TableManager {
  constructor(editor) {
    this.editor = editor;
  }

  // Navigate within table cells
  navigate(cell, direction) {
    const row = cell.parentElement;
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

  // Insert a new row
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
    this.editor.updateMarkdownFromPreview();
  }

  // Insert a new column
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
    this.editor.updateMarkdownFromPreview();
  }

  // Delete a row
  deleteRow(cell) {
    const row = cell.parentElement;
    if (row.parentElement.rows.length > 1) { // Prevent deleting the last row
      row.remove();
      this.editor.updateMarkdownFromPreview();
    }
  }

  // Delete a column
  deleteColumn(cell) {
    const table = cell.closest("table");
    const cellIndex = cell.cellIndex;
    
    if (table.rows[0].cells.length > 1) { // Prevent deleting the last column
      Array.from(table.rows).forEach(row => {
        row.deleteCell(cellIndex);
      });
      this.editor.updateMarkdownFromPreview();
    }
  }

  // Merge all cells in a row
  mergeCells(cell) {
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
    
    this.editor.updateMarkdownFromPreview();
  }

  // Insert a new table at the current cursor position
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

    this.editor.updateMarkdownFromPreview();
  }
}
