const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('RecurringParser');

/**
 * Parse recurring pattern from text
 * @param {string} text - Input text
 * @returns {Object|null} Recurring pattern object
 */
function parse(text) {
  try {
    for (const [type, pattern] of Object.entries(CONFIG.recurringPatterns)) {
      const match = text.match(pattern);
      if (match) {
        return {
          type,
          ...(match.groups?.day && { interval: match.groups.day.toLowerCase() }),
        };
      }
    }
    return null;
  } catch (error) {
    logger.error('Error parsing recurring pattern:', error);
    return null;
  }
}

module.exports = { parse }; 