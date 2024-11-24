const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('ContactParser');

/**
 * Parse contact from text
 * @param {string} text - Input text
 * @returns {string|null} Contact name
 */
function parse(text) {
  try {
    // Check for text message contact
    const textMatch = text.match(/text\s+([A-Z][a-z]+)/i);
    if (textMatch) {
      return textMatch[1];
    }

    // Check for with/to contact
    const withMatch = text.match(/(?:with|to)\s+([A-Z][a-z]+)(?=\s|,|$)/i);
    if (withMatch) {
      return withMatch[1];
    }

    return null;
  } catch (error) {
    logger.error('Error parsing contact:', error);
    return null;
  }
}

module.exports = { parse }; 