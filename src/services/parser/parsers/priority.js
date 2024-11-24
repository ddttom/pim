const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('PriorityParser');

/**
 * Parse priority from text
 * @param {string} text - Input text
 * @returns {string|null} Priority level
 */
function parse(text) {
  try {
    // Check for urgent/important words
    if (/\b(urgent|important|asap)\b/i.test(text)) {
      return 'high';
    }
    if (/\b(normal|moderate|regular)\b/i.test(text)) {
      return 'medium';
    }
    if (/\b(low|minor|whenever)\b/i.test(text)) {
      return 'low';
    }

    // Check text-based priority patterns
    for (const [priority, pattern] of Object.entries(CONFIG.priorityPatterns)) {
      if (pattern.test(text)) {
        return priority;
      }
    }
    return null;
  } catch (error) {
    logger.error('Error parsing priority:', error);
    return null;
  }
}

module.exports = { parse }; 