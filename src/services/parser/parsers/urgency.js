const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('UrgencyParser');

/**
 * Parse urgency from text
 * @param {string} text - Input text
 * @returns {Object|null} Urgency object
 */
function parse(text) {
  try {
    for (const [level, pattern] of Object.entries(CONFIG.urgencyPatterns)) {
      if (pattern.test(text)) {
        return { level };
      }
    }
    return null;
  } catch (error) {
    logger.error('Error parsing urgency:', error);
    return null;
  }
}

module.exports = { parse }; 