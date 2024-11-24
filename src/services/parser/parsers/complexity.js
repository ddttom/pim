const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('ComplexityParser');

/**
 * Parse complexity from text
 * @param {string} text - Input text
 * @returns {Object|null} Complexity object
 */
function parse(text) {
  try {
    for (const [level, pattern] of Object.entries(CONFIG.complexityPatterns)) {
      if (pattern.test(text)) {
        return { level };
      }
    }
    return null;
  } catch (error) {
    logger.error('Error parsing complexity:', error);
    return null;
  }
}

module.exports = { parse }; 