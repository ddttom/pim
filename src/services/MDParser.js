export class MarkdownParser {
  constructor() {
    // Image and link patterns
    this.imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/;
    this.linkPattern = /\[([^\]]+)\]\(([^)]+)\)/;
    
    // Text formatting patterns
    this.boldPattern = /\*\*([^*]+)\*\*/g;
    this.italicPattern = /_([^_]+)_/g;
    this.courierPattern = /`([^`]+)`/g;
  }

  parse(markdown) {
    const lines = markdown.split('\n');
    let html = '';
    let inList = false;
    let inTable = false;
    let tableRows = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Handle tables
      if (trimmedLine.startsWith('|') || trimmedLine.startsWith('+--')) {
        if (!inTable) {
          if (inList) {
            html += '</ul>';
            inList = false;
          }
          inTable = true;
          tableRows = [];
        }
        tableRows.push(line);
        return;
      } else if (inTable) {
        html += this.processTable(tableRows);
        inTable = false;
      }

      if (!trimmedLine) {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        if (html && !html.endsWith('</p>')) {
          html += '</p>';
        }
        html += '<p>';
        return;
      }

      // Headers
      if (trimmedLine.startsWith('#')) {
        const level = trimmedLine.match(/^#+/)[0].length;
        const text = trimmedLine.slice(level).trim();
        const id = text.toLowerCase().replace(/[^\w]+/g, '-');
        html += `<h${level} id="${id}">${this.formatText(text)}</h${level}>`;
        return;
      }

      // Lists
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        const text = trimmedLine.slice(2);
        html += `<li>${this.formatText(text)}</li>`;
        return;
      }

      if (inList) {
        html += '</ul>';
        inList = false;
      }

      // Process images and links first, then other formatting
      let processedLine = this.processImages(trimmedLine);
      processedLine = this.processLinks(processedLine);
      processedLine = this.formatText(processedLine);

      if (processedLine) {
        if (!html.endsWith('<p>')) {
          html += '<p>';
        }
        html += processedLine;
        html += '</p>';
      }
    });

    if (inList) {
      html += '</ul>';
    }
    if (inTable) {
      html += this.processTable(tableRows);
    }

    return `<div>${html}</div>`;
  }

  processTable(rows) {
    let html = '<table>';
    let isHeader = true;
    
    // Process header row
    const headerRow = rows[0];
    if (headerRow) {
      html += '<tr>';
      const headers = headerRow
        .split('|')
        .slice(1, -1) // Remove empty first/last cells
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0); // Remove empty cells
      
      headers.forEach(header => {
        html += `<th>${this.formatText(header)}</th>`;
      });
      html += '</tr>';
    }

    // Process data rows
    rows.slice(1).forEach(row => {
      const trimmedRow = row.trim();
      if (trimmedRow.startsWith('+--')) {
        return; // Skip separator lines
      }
      
      html += '<tr>';
      const cells = trimmedRow
        .split('|')
        .slice(1, -1) // Remove empty first/last cells
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0); // Remove empty cells
      
      cells.forEach(cell => {
        html += `<td>${this.formatText(cell)}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</table>';
    return html;
  }

  processImages(text) {
    return text.replace(this.imagePattern, (match, alt, src) => {
      const url = new URL(src);
      const params = new URLSearchParams(url.hash.slice(1));
      
      const width = params.get('width') || '750';
      const height = params.get('height') || 'auto';
      
      return `
        <picture>
          <source type="image/webp" 
            srcset="${url.origin + url.pathname}?width=2000&format=webply&optimize=medium" 
            media="(min-width: 600px)">
          <source type="image/webp" 
            srcset="${url.origin + url.pathname}?width=${width}&format=webply&optimize=medium">
          <source type="image/png" 
            srcset="${url.origin + url.pathname}?width=2000&format=png&optimize=medium" 
            media="(min-width: 600px)">
          <img loading="lazy" alt="${alt}" 
            src="${url.origin + url.pathname}?width=${width}&format=png&optimize=medium" 
            width="${width}" height="${height}">
        </picture>
      `;
    });
  }

  processLinks(text) {
    return text.replace(this.linkPattern, '<a href="$2">$1</a>');
  }

  formatText(text) {
    let formatted = text;
    // Handle bold text
    formatted = formatted.replace(this.boldPattern, '<strong>$1</strong>');
    // Handle italic text
    formatted = formatted.replace(this.italicPattern, '<em>$1</em>');
    // Handle courier (code) text
    formatted = formatted.replace(this.courierPattern, '<code>$1</code>');
    return formatted;
  }
}
