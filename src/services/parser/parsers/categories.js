const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('CategoriesParser');

/**
 * Parse categories from text
 * @param {string} text - Input text
 * @returns {string[]} Array of categories
 */
function parse(text) {
  try {
    const categories = new Set();
    
    // Add action-based categories
    if (text.toLowerCase().includes('call') || text.toLowerCase().includes('text')) {
      categories.add('calls');
    }
    if (text.toLowerCase().includes('meet')) {
      categories.add('meetings');
    }
    if (text.toLowerCase().includes('review')) {
      categories.add('reviews');
    }

    // Add pattern-based categories
    if (CONFIG.categoryPatterns) {
      for (const [category, pattern] of Object.entries(CONFIG.categoryPatterns)) {
        if (pattern.test(text)) {
          categories.add(category);
        }
      }
    }

    return Array.from(categories);
  } catch (error) {
    logger.error('Error parsing categories:', error);
    return [];
  }
}

module.exports = { parse }; 