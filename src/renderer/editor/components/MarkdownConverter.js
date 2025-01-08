// Handles conversion between Markdown and HTML formats
export class MarkdownConverter {
  constructor() {
    this.imageReferences = {};
    this.lastValidMarkdown = '';
    this.lastValidHtml = '<p dir="ltr" style="direction:ltr;unicode-bidi:isolate"><br></p>';
  }

  // Get last valid content
  getLastValidContent(type) {
    return type === 'markdown' ? this.lastValidMarkdown : this.lastValidHtml;
  }

  // Store valid content
  storeValidContent(content, type) {
    if (type === 'markdown') {
      this.lastValidMarkdown = content;
    } else {
      this.lastValidHtml = content;
    }
  }

  // Convert Markdown to HTML
  toHtml(markdown) {
    if (!markdown || markdown.trim() === '') return '';
    
    console.log('toHtml - Input markdown:', markdown);
    // Normalize markdown text first
    const tempSpan = document.createElement('span');
    tempSpan.setAttribute('dir', 'ltr');
    tempSpan.style.direction = 'ltr';
    tempSpan.style.unicodeBidi = 'plaintext';
    tempSpan.textContent = markdown;
    const normalizedMarkdown = tempSpan.textContent;
    
    // Validate normalized markdown
    if (!normalizedMarkdown || normalizedMarkdown.trim() === '') {
      return '';
    }
    
    // Split normalized text into lines
    const lines = normalizedMarkdown.split("\n");
    if (!lines.length) {
      return '';
    }
    console.log('toHtml - Split lines:', lines);
    let headerContent = "";
    let tableContent = "";
    let otherContent = "";

    // Reset references for new content
    this.imageReferences = {};

    // First pass: collect image references
    lines.forEach(line => {
      const refMatch = line.match(/^\[([^\]]+)\]:\s*(.+)$/);
      if (refMatch) {
        this.imageReferences[refMatch[1]] = refMatch[2].trim();
      }
    });

    // Second pass: process content in original order
    let currentContent = [];
    let currentType = null;

    // Helper function to process a table
    const processTable = (tableLines) => {
      let isHeader = true;
      let skipNextLine = false;
      let tableAlignments = [];

      tableContent += '<table dir="ltr" style="direction:ltr;unicode-bidi:isolate">\n';

      tableLines.forEach((line, index) => {
        if (skipNextLine) {
          skipNextLine = false;
          return;
        }

        if (line.trim().startsWith("|")) {
          const cells = line
            .trim()
            .split("|")
            .filter(Boolean)
            .map(cell => cell.trim());

          // Parse alignment from next line if it's a separator
          const nextLine = tableLines[index + 1];
          if (nextLine && nextLine.includes("---")) {
            tableAlignments = nextLine
              .trim()
              .split("|")
              .filter(Boolean)
              .map(col => {
                if (col.startsWith(":") && col.endsWith(":")) return "center";
                if (col.endsWith(":")) return "right";
                if (col.startsWith(":")) return "left";
                return "left";
              });
            skipNextLine = true;
          }

          tableContent += '<tr dir="ltr" style="direction:ltr;unicode-bidi:isolate">';
          cells.forEach((cell, cellIndex) => {
            const tag = isHeader ? "th" : "td";
            const align = tableAlignments[cellIndex] || "left";
            tableContent += `<${tag} dir="ltr" style="text-align:${align};direction:ltr;unicode-bidi:isolate">${this.processInlineMarkdown(cell)}</${tag}>`;
          });
          tableContent += "</tr>\n";

          if (skipNextLine) {
            isHeader = false;
          }
        }
      });

      tableContent += "</table>\n";
    };

    // Process content in order
    lines.forEach((line, index) => {
      // Skip image references
      if (line.match(/^\[([^\]]+)\]:\s*(.+)$/)) {
        return;
      }

      // Handle headers
      if (line.startsWith("#")) {
        // Process any pending content
        if (currentType === 'table' && currentContent.length > 0) {
          processTable(currentContent);
          currentContent = [];
        }
        const level = line.match(/^#+/)[0].length;
        headerContent += `<h${level} dir="ltr" style="direction:ltr;unicode-bidi:isolate">${this.processInlineMarkdown(line.slice(level).trim())}</h${level}>\n`;
        currentType = 'header';
      }
      // Handle tables
      else if (line.trim().startsWith("|") || (currentType === 'table' && line.trim())) {
        if (currentType !== 'table') {
          currentType = 'table';
          currentContent = [];
        }
        currentContent.push(line);

        // Check if this is the last line of the table
        const nextLine = lines[index + 1];
        if (!nextLine || (!nextLine.trim().startsWith("|") && nextLine.trim())) {
          processTable(currentContent);
          currentContent = [];
          currentType = null;
        }
      }
      // Handle other content
      else if (line.trim() && !line.trim().startsWith("[")) {
        if (currentType === 'table' && currentContent.length > 0) {
          processTable(currentContent);
          currentContent = [];
        }
        otherContent += `<p dir="ltr" style="direction:ltr;unicode-bidi:isolate">${this.processInlineMarkdown(line.trim())}</p>\n`;
        currentType = 'other';
      }
    });

    // Process any remaining table content
    if (currentType === 'table' && currentContent.length > 0) {
      processTable(currentContent);
    }

    // Combine and store content
    const result = headerContent + tableContent + otherContent;
    if (result) {
      this.storeValidContent(result, 'html');
    }
    return result;
  }

  // Process inline markdown (bold, italic, etc.)
  processInlineMarkdown(text) {
    if (!text) return "";
    console.log('processInlineMarkdown - Input text:', text);
    
    // Create a temporary span to handle text direction
    const span = document.createElement('span');
    span.setAttribute('dir', 'ltr');
    span.style.direction = 'ltr';
    span.style.unicodeBidi = 'plaintext';
    span.textContent = text;
    
    // Get the properly directed text
    const directedText = span.textContent;
    
    // Create another span to ensure consistent direction
    const inlineFinalSpan = document.createElement('span');
    inlineFinalSpan.setAttribute('dir', 'ltr');
    inlineFinalSpan.style.direction = 'ltr';
    inlineFinalSpan.style.unicodeBidi = 'plaintext';
    inlineFinalSpan.textContent = directedText;
    
    // Use the final normalized text
    text = inlineFinalSpan.textContent;
    console.log('processInlineMarkdown - Directed text:', text);
  
    // Handle image references
    if (text.includes("![][")) {
      const refMatch = text.match(/!\[\]\[([^\]]+)\]/);
      if (refMatch && this.imageReferences && this.imageReferences[refMatch[1]]) {
        text = text.replace(
          /!\[\]\[([^\]]+)\]/,
          `<img src="${this.imageReferences[refMatch[1]]}" alt="">`
        );
      }
    }
    
    // Handle bold text
    let processedText = text.replace(/\*\*(.*?)\*\*/g, (match, content) => 
      `<strong dir="ltr" style="direction:ltr;unicode-bidi:isolate">${content}</strong>`
    );
    
    // Handle italic text
    processedText = processedText.replace(/\*(.*?)\*/g, (match, content) => 
      `<em dir="ltr" style="direction:ltr;unicode-bidi:isolate">${content}</em>`
    );
    
    // Handle inline code
    processedText = processedText.replace(/`(.*?)`/g, (match, content) => 
      `<code dir="ltr" style="direction:ltr;unicode-bidi:isolate">${content}</code>`
    );
    
    // Wrap in span to ensure proper direction
    return `<span dir="ltr" style="direction:ltr;unicode-bidi:isolate">${processedText}</span>`;
  }

  // Convert HTML to Markdown
  toMarkdown(html) {
    if (!html || html.trim() === '' || html === '<p><br></p>') return ""; // Early return for empty input
    console.log('toMarkdown - Input HTML:', html);

    const div = document.createElement("div");
    div.setAttribute('dir', 'ltr');
    div.style.direction = 'ltr';
    div.style.unicodeBidi = 'plaintext';
    div.innerHTML = html;

    // First collect all nodes in document order
    const nodes = [];
    const walk = (node) => {
      nodes.push(node);
      node.childNodes.forEach(walk);
    };
    walk(div);

    // Process nodes to collect content
    const processNode = (node) => {
      if (!node) return "";
      console.log('processNode - Processing:', node.nodeType === Node.TEXT_NODE ? node.textContent : node.outerHTML);

      switch (node.nodeType) {
        case Node.TEXT_NODE:
          // Get text content and normalize direction
          const text = node.textContent.trim();
          console.log('Text Node - Original:', text);
          
          // Create a temporary span to handle text direction
          const span = document.createElement('span');
          span.setAttribute('dir', 'ltr');
          span.style.direction = 'ltr';
          span.style.unicodeBidi = 'plaintext';
          span.textContent = text;
          
          // Get the properly directed text
          const directedText = span.textContent;
          console.log('Text Node - Directed:', directedText);
          
          // Create another span to ensure consistent direction
          const textFinalSpan = document.createElement('span');
          textFinalSpan.setAttribute('dir', 'ltr');
          textFinalSpan.style.direction = 'ltr';
          textFinalSpan.style.unicodeBidi = 'plaintext';
          textFinalSpan.textContent = directedText;
          
          // Return the final normalized text
          return textFinalSpan.textContent;

        case Node.ELEMENT_NODE:
          const tag = node.tagName.toLowerCase();
          // Process child nodes with direction control
          const childNodes = Array.from(node.childNodes);
          const processedNodes = childNodes.map(child => processNode(child));
          
          // Create a temporary span to normalize joined content
          const tempSpan = document.createElement('span');
          tempSpan.setAttribute('dir', 'ltr');
          tempSpan.style.direction = 'ltr';
          tempSpan.style.unicodeBidi = 'plaintext';
          tempSpan.textContent = processedNodes.join("");
          
          // Get normalized text
          const normalizedContent = tempSpan.textContent;
          
          // Create another span to ensure consistent direction
          const contentFinalSpan = document.createElement('span');
          contentFinalSpan.setAttribute('dir', 'ltr');
          contentFinalSpan.style.direction = 'ltr';
          contentFinalSpan.style.unicodeBidi = 'plaintext';
          contentFinalSpan.textContent = normalizedContent;
          
          // Use final normalized text
          const childContent = contentFinalSpan.textContent;

          switch (tag) {
            case "img":
              const src = node.getAttribute("src");
              if (src) {
                // Create image reference
                const refName = "image1";
                return `![][${refName}]\n\n[${refName}]: ${src}`;
              }
              return "";

            case "h1": case "h2": case "h3": case "h4": case "h5": case "h6":
              const level = parseInt(tag[1]);
              const headerText = childContent.trim();
              if (headerText) {
                return "#".repeat(level) + " " + headerText + "\n\n";
              }
              return "";

            case "table":
              let tableMarkdown = "\n";
              const rows = Array.from(node.rows);
              
              // Process header row
              if (rows.length > 0) {
                const headerCells = Array.from(rows[0].cells);
                tableMarkdown += "| " + headerCells.map(cell => processNode(cell).trim()).join(" | ") + " |\n";
                
                // Add alignment row
                tableMarkdown += "|" + headerCells.map(cell => {
                  const align = cell.style.textAlign || "left";
                  switch (align) {
                    case "center": return " :---: ";
                    case "right": return " ---: ";
                    default: return " :--- ";
                  }
                }).join("|") + "|\n";
                
                // Process data rows
                rows.slice(1).forEach(row => {
                  const cells = Array.from(row.cells);
                  tableMarkdown += "| " + cells.map(cell => processNode(cell).trim()).join(" | ") + " |\n";
                });
              }
              return tableMarkdown + "\n";

            case "tr": case "td": case "th":
              return childContent;

            case "p":
              if (childContent) {
                return childContent + "\n\n";
              }
              return "";

            case "strong": return `**${childContent}**`;
            case "em": return `*${childContent}*`;
            case "code": return `\`${childContent}\``;
            default:
              return childContent;
          }
      }
      return "";
    };

    try {
      // Process only top-level nodes to prevent duplication
      let markdown = "";
      const topLevelNodes = Array.from(div.children);
      topLevelNodes.forEach(node => {
        const result = processNode(node);
        if (result) {
          markdown += result;
        }
      });

      // Clean up markdown and normalize spacing
      markdown = markdown
        .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
        .replace(/^\n+|\n+$/g, '') // Remove leading/trailing newlines
        .trim();

      console.log('toMarkdown - Final result:', markdown);

      // Store valid markdown
      if (markdown) {
        this.storeValidContent(markdown, 'markdown');
      }
      return markdown;

    } catch (error) {
      console.error("Error processing HTML to Markdown:", error);
      return "";
    }
  }
}
