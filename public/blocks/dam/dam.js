// Configuration object for the DAM block
const DAM_CONFIG = {
  ERROR_MESSAGES: {
    MISSING_IMAGE: 'Image element is missing or invalid',
    JSON_PARSE: 'Error parsing DAM data',
    INVALID_BLOCK: 'Invalid DAM block structure',
  },
  SELECTORS: {
    IMAGE: 'img',
    LINK: 'a',
  },
  CLASS_NAMES: {
    CODE_WRAPPER: 'dam-code',
  },
  ARIA_LABELS: {
    CODE_SECTION: 'DAM metadata JSON output',
    ERROR_MESSAGE: 'Error in DAM block',
  },
};

/**
 * Extracts the path from an image or link element
 * @param {HTMLElement} element - The element containing the image or link
 * @returns {string} The extracted path
 */
function extractPath(element) {
  const img = element.querySelector(DAM_CONFIG.SELECTORS.IMAGE);
  const link = element.querySelector(DAM_CONFIG.SELECTORS.LINK);
  
  if (img) {
    const url = new URL(img.src);
    return url.pathname;
  }
  
  if (link) {
    const url = new URL(link.href);
    return url.pathname;
  }
  
  return '';
}

/**
 * Creates a JSON representation of the DAM data
 * @param {HTMLElement} block - The DAM block element
 * @returns {string} Formatted JSON string
 */
function createDamJson(block) {
  if (!block || !block.children.length) {
    throw new Error(DAM_CONFIG.ERROR_MESSAGES.INVALID_BLOCK);
  }

  const rows = Array.from(block.children).slice(1);
  const damData = rows.map((row) => {
    const [, note, description, classification, tag, imageCell, additionalInfo] = 
      Array.from(row.children);
    
    return {
      note: note?.textContent?.trim() || '',
      description: description?.textContent?.trim() || '',
      classification: classification?.textContent?.trim() || '',
      tag: tag?.textContent?.trim() || '',
      path: extractPath(imageCell),
      additionalInfo: additionalInfo?.textContent?.trim() || '',
    };
  });
  
  return JSON.stringify(damData, null, 2);
}

/**
 * Creates the code display element
 * @param {string} jsonString - The formatted JSON string
 * @returns {HTMLElement} The code display element
 */
function createCodeDisplay(jsonString) {
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  
  pre.setAttribute('role', 'region');
  pre.setAttribute('aria-label', DAM_CONFIG.ARIA_LABELS.CODE_SECTION);
  pre.setAttribute('tabindex', '0');
  
  code.textContent = jsonString;
  pre.appendChild(code);
  pre.className = DAM_CONFIG.CLASS_NAMES.CODE_WRAPPER;
  
  return pre;
}

/**
 * Decorates the DAM block
 * @param {HTMLElement} block - The block element
 */
export default async function decorate(block) {
  try {
    const jsonString = createDamJson(block);
    const codeDisplay = createCodeDisplay(jsonString);
    block.textContent = '';
    block.appendChild(codeDisplay);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(DAM_CONFIG.ERROR_MESSAGES.JSON_PARSE, error);
    const errorElement = document.createElement('div');
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-label', DAM_CONFIG.ARIA_LABELS.ERROR_MESSAGE);
    errorElement.textContent = error.message;
    block.appendChild(errorElement);
  }
}
