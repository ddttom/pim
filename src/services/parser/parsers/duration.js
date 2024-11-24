const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');
const { convertToMinutes } = require('../utils/timeUtils');

const logger = createLogger('DurationParser');

/**
 * Parse duration from text
 * @param {string} text - Input text
 * @returns {Object|null} Duration object
 */
function parse(text) {
  try {
    // Check for duration with "lasting" or "for"
    const durationMatch = text.match(CONFIG.durationPatterns.duration);
    if (durationMatch?.groups) {
      const { amount, unit } = durationMatch.groups;
      const value = parseInt(amount, 10);
      
      if (unit.toLowerCase().startsWith('hour')) {
        return { hours: value };
      } else if (unit.toLowerCase().startsWith('min')) {
        return { minutes: value };
      }
    }

    // Check for minutes pattern
    const minutesMatch = text.match(CONFIG.durationPatterns.minutes);
    if (minutesMatch?.groups) {
      return { minutes: parseInt(minutesMatch.groups.amount, 10) };
    }

    // Check for hours pattern
    const hoursMatch = text.match(CONFIG.durationPatterns.hours);
    if (hoursMatch?.groups) {
      return { hours: parseInt(hoursMatch.groups.amount, 10) };
    }

    // Check for simple duration pattern
    const simpleMatch = text.match(/for\s+(\d+)\s*(hour|hr|minute|min)s?/i);
    if (simpleMatch) {
      const [, value, unit] = simpleMatch;
      if (unit.toLowerCase().startsWith('hour') || unit.toLowerCase() === 'hr') {
        return { hours: parseInt(value, 10) };
      } else {
        return { minutes: parseInt(value, 10) };
      }
    }

    return null;
  } catch (error) {
    logger.error('Error parsing duration:', error);
    return null;
  }
}

module.exports = { parse }; 