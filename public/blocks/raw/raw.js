import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  let content = block.innerHTML.trim();
  block.innerHTML = '';

  // Remove surrounding quotes if present
  if (content.startsWith('"') && content.endsWith('"')) {
    content = content.slice(1, -1);
  }

  // Decode HTML entities
  content = decodeHTMLEntities(content);

  // Sanitize the content
  const sanitizedContent = sanitizeHTML(content);

  // Validate HTML structure
  if (isValidHTML(sanitizedContent)) {
    try {
      block.insertAdjacentHTML('beforeend', sanitizedContent);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error inserting HTML:', error);
      reportIssue('Error inserting HTML', error);
    }
  } else {
    // eslint-disable-next-line no-console
    console.warn('Invalid HTML structure detected');
    reportIssue('Invalid HTML structure', sanitizedContent);
  }
}

function decodeHTMLEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function sanitizeHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Remove potentially harmful elements and attributes
  const harmfulTags = ['script', 'object', 'embed'];
  const harmfulAttributes = ['onerror', 'onload', 'onclick', 'onmouseover'];
  
  harmfulTags.forEach(tag => {
    const elements = doc.getElementsByTagName(tag);
    for (let i = elements.length - 1; i >= 0; i--) {
      elements[i].parentNode.removeChild(elements[i]);
    }
  });
  
  doc.body.querySelectorAll('*').forEach(el => {
    harmfulAttributes.forEach(attr => {
      el.removeAttribute(attr);
    });
    
    // Special handling for iframes
    if (el.tagName.toLowerCase() === 'iframe') {
      // Allow only specific attributes
      const allowedAttributes = ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'allow'];
      Array.from(el.attributes).forEach(attr => {
        if (!allowedAttributes.includes(attr.name)) {
          el.removeAttribute(attr.name);
        }
      });
      
      // Ensure src is from a trusted domain
      const trustedDomains = ['ooo.mmhmm.app']; // Add more trusted domains as needed
      const src = el.getAttribute('src');
      if (src) {
        const url = new URL(src, window.location.origin);
        if (!trustedDomains.includes(url.hostname)) {
          el.removeAttribute('src');
        }
      }
    }
  });
  
  return doc.body.innerHTML;
}

function isValidHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.querySelector('parsererror') === null;
}

function reportIssue(type, details) {
  // Implement your reporting mechanism here
  // This could be an API call to a logging service or a custom reporting system
  // eslint-disable-next-line no-console
  console.warn(`Raw Block Issue: ${type}`, details);
}