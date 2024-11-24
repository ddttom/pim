const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('ActionParser');

/**
 * Parse action from text
 * @param {string} text - Input text
 * @returns {string|null} Parsed action
 */
function parse(text) {
  try {
    // Check for text messages first
    if (text.toLowerCase().includes('text')) {
      return 'text';
    }

    const match = text.match(CONFIG.patterns.action);
    if (match?.groups?.action) {
      return match.groups.action.toLowerCase();
    }
    return null;
  } catch (error) {
    logger.error('Error parsing action:', error);
    return null;
  }
}

module.exports = { parse }; 