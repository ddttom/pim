// Internal Editor Implementation
export default class Editor {
    constructor(container) {
        this.container = container;
        this.editor = null;
        this.preview = null;
        this.setupEditor();
    }

    setupEditor() {
        // Create editor container
        const editorContainer = document.createElement('div');
        editorContainer.className = 'editor-content';
        
        // Create editor textarea
        this.editor = document.createElement('textarea');
        this.editor.className = 'editor-input';
        this.editor.placeholder = 'Enter text...';
        
        // Create preview div
        this.preview = document.createElement('div');
        this.preview.className = 'preview-content';
        
        // Add editor and preview to container
        editorContainer.appendChild(this.editor);
        editorContainer.appendChild(this.preview);
        
        // Add container to main container
        this.container.appendChild(editorContainer);

        // Bind events
        this.editor.addEventListener('input', () => this.updatePreview());
    }

    updatePreview() {
        const markdown = this.editor.value;
        const html = this.markdownToHtml(markdown);
        this.preview.innerHTML = html;
    }

    markdownToHtml(markdown) {
        // Split into lines for processing
        const lines = markdown.split('\n');
        let html = '';
        let inTable = false;
        let tableHeader = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            // Handle headers
            if (line.startsWith('#')) {
                const level = line.match(/^#+/)[0].length;
                if (level <= 5) {
                    const text = line.slice(level).trim();
                    html += `<h${level}>${text}</h${level}>\n`;
                    continue;
                }
            }

            // Handle tables
            if (line.startsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableHeader = true;
                    html += '<table>\n<thead>\n<tr>\n';
                    const cells = line.split('|').filter(cell => cell.trim());
                    cells.forEach(cell => {
                        html += `<th>${cell.trim()}</th>\n`;
                    });
                    html += '</tr>\n</thead>\n<tbody>\n';
                } else if (line.includes('---')) {
                    // Skip alignment row
                    continue;
                } else if (tableHeader) {
                    tableHeader = false;
                } else {
                    html += '<tr>\n';
                    const cells = line.split('|').filter(cell => cell.trim());
                    cells.forEach(cell => {
                        html += `<td>${cell.trim()}</td>\n`;
                    });
                    html += '</tr>\n';
                }
                continue;
            } else if (inTable) {
                inTable = false;
                html += '</tbody>\n</table>\n';
            }

            // Handle code blocks
            if (line.startsWith('`')) {
                const text = line.slice(1, -1);
                html += `<code>${text}</code>\n`;
                continue;
            }

            // Handle paragraphs
            if (line.length > 0) {
                html += `<p>${line}</p>\n`;
            } else {
                html += '<br>\n';
            }
        }

        // Close any open table
        if (inTable) {
            html += '</tbody>\n</table>\n';
        }

        return html;
    }

    getContents() {
        return {
            raw: this.editor.value,
            html: this.preview.innerHTML
        };
    }

    setContents(content) {
        if (typeof content === 'string') {
            this.editor.value = content;
        } else if (content && content.raw) {
            this.editor.value = content.raw;
        }
        this.updatePreview();
    }
}
