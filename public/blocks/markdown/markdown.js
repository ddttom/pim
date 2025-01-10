import { createOptimizedPicture } from '../../scripts/aem.js';

const MARKDOWN_CONFIG = {
  CONTAINER_CLASS: 'markdown-content',
  ERROR_MESSAGE: 'Error processing markdown content.',
};

// Function to trim all lines in the content and handle double backticks
function processContent(content) {
  return content
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .replace(/``/g, '`\n`');
}

// Function to escape HTML special characters
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Function to add syntax highlighting
function addSyntaxHighlighting(code) {
  return escapeHtml(code)
    // Strings
    .replace(/(["'])(.*?)\1/g, '<span class="string">$&</span>')
    // Keywords
    .replace(/\b(const|let|var|function|return|if|else|for|while|class)\b/g, '<span class="keyword">$&</span>')
    // Comments
    .replace(/(\/\/.*|\/\*[\s\S]*?\*\/)/g, '<span class="comment">$&</span>')
    // Numbers
    .replace(/\b(\d+)\b/g, '<span class="number">$&</span>')
    // Function names
    .replace(/(\w+)(?=\s*\()/g, '<span class="function">$&</span>');
}

export default function decorate(block) {
  try {
    const content = block.textContent.trim();
    const processedContent = processContent(content);
    
    const container = document.createElement('div');
    container.className = MARKDOWN_CONFIG.CONTAINER_CLASS;
    
    // Create a pre element to preserve formatting
    const preElement = document.createElement('pre');
    preElement.innerHTML = addSyntaxHighlighting(processedContent);
    
    container.appendChild(preElement);

    // Clear the original content and append the processed content
    block.textContent = '';
    block.appendChild(container);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(MARKDOWN_CONFIG.ERROR_MESSAGE, error);
    block.textContent = MARKDOWN_CONFIG.ERROR_MESSAGE;
  }
}
