const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('DependenciesParser');

/**
 * Parse dependencies from text
 * @param {string} text - Input text
 * @returns {Object|null} Dependencies object
 */
function parse(text) {
  try {
    const result = {};

    // Parse "after" dependencies with "is complete"
    const afterMatch = text.match(/(?:after|when)\s+([^,\.]+?)(?:\s+is\s+complete)?(?=\s+(?:and|or|,|\.|$))/i);
    if (afterMatch) {
      result.after = afterMatch[1].trim();
    }

    // Parse "before" dependencies
    const beforeMatch = text.match(/before\s+([^,\.]+)/i);
    if (beforeMatch) {
      result.before = beforeMatch[1].trim();
    }

    // Parse follow-up pattern with proper pluralization
    const followupMatch = text.match(/(?:follow|check)\s+(?:up|back)\s+in\s+(\d+)\s*(\w+)/i);
    if (followupMatch) {
      const [, time, unit] = followupMatch;
      const timeValue = parseInt(time, 10);
      result.followup = {
        time: timeValue,
        unit: unit.toLowerCase() + (timeValue > 1 ? 's' : ''),
      };
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    logger.error('Error parsing dependencies:', error);
    return null;
  }
}

module.exports = { parse }; 