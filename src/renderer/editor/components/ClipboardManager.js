// Handles clipboard operations
export class ClipboardManager {
  constructor(editor) {
    this.editor = editor;
  }

  // Copy selected content
  async copy() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // Create container
    const container = document.createElement('div');
    container.appendChild(range.cloneContents());
    
    // Clean and convert content
    const cleanHtml = this.editor.core.cleanContent(container.innerHTML);
    const markdown = this.editor.core.converter.toMarkdown(cleanHtml);
    
    try {
      await navigator.clipboard.writeText(markdown);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }

  // Cut selected content
  async cut() {
    await this.copy();
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // Delete content and clean up
    range.deleteContents();
    const cleanHtml = this.editor.core.cleanContent(this.editor.core.preview.innerHTML);
    this.editor.core.preview.innerHTML = cleanHtml;
    
    // Convert and sync content
    const markdown = this.editor.core.converter.toMarkdown(cleanHtml);
    this.editor.core.markdownTextarea.value = markdown || '';
  }

  // Paste content
  async paste() {
    try {
      const text = await navigator.clipboard.readText();
      const html = this.editor.core.converter.toHtml(text);
      const cleanHtml = html ? this.editor.core.cleanContent(html) : '<p><br></p>';
      
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      
      // Create temporary container
      const container = document.createElement('div');
      container.innerHTML = cleanHtml;
      
      range.deleteContents();
      document.execCommand('insertHTML', false, container.innerHTML);
      
      // Convert and sync content
      const markdown = this.editor.core.converter.toMarkdown(container.innerHTML);
      this.editor.core.markdownTextarea.value = markdown || '';
    } catch (error) {
      console.error('Failed to paste text:', error);
    }
  }

  // Handle paste event
  handlePasteEvent(e) {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    const text = clipboardData.getData('text/plain');
    
    // Convert text to HTML and clean
    const html = this.editor.core.converter.toHtml(text);
    const cleanHtml = html ? this.editor.core.cleanContent(html) : '<p><br></p>';
    
    // Create temporary container
    const container = document.createElement('div');
    container.innerHTML = cleanHtml;
    
    // Insert at cursor position with proper direction
    document.execCommand('insertHTML', false, container.innerHTML);
    
    // Convert and sync content
    const markdown = this.editor.core.converter.toMarkdown(container.innerHTML);
    this.editor.core.markdownTextarea.value = markdown || '';
  }
}
