const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('TimeParser');

/**
 * Parse time of day from text
 * @param {string} text - Input text
 * @returns {Object|null} Time object
 */
function parse(text) {
  try {
    // Check for period words first (morning, afternoon, evening)
    for (const [period, config] of Object.entries(CONFIG.timeOfDay)) {
      if (text.toLowerCase().includes(period)) {
        return {
          period,
          start: config.start,
          end: config.end,
        };
      }
    }

    // Parse specific time
    const match = text.match(CONFIG.patterns.time);
    if (match?.groups) {
      const { hours, minutes, meridian } = match.groups;
      let hour = parseInt(hours, 10);
      
      // Convert to 24-hour format
      if (meridian?.toLowerCase() === 'pm' && hour < 12) {
        hour += 12;
      } else if (meridian?.toLowerCase() === 'am' && hour === 12) {
        hour = 0;
      }

      return {
        hour,
        minute: parseInt(minutes || '0', 10),
      };
    }

    return null;
  } catch (error) {
    logger.error('Error parsing time of day:', error);
    return null;
  }
}

module.exports = { parse }; 