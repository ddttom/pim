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
    logger.debug('Starting time parse:', { text });

    // Check for period words first (morning, afternoon, evening)
    for (const [period, config] of Object.entries(CONFIG.timeOfDay)) {
      if (text.toLowerCase().includes(period)) {
        logger.debug('Found period match:', { period, config });
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
      
      logger.debug('Found specific time match:', { hours, minutes, meridian });
      
      // Convert to 24-hour format
      if (meridian?.toLowerCase() === 'pm' && hour < 12) {
        hour += 12;
      } else if (meridian?.toLowerCase() === 'am' && hour === 12) {
        hour = 0;
      }

      logger.debug('Converted to 24-hour format:', { hour });

      return {
        hour,
        minute: parseInt(minutes || '0', 10),
      };
    }

    // Return default time for actions that require it
    if (text.match(/\b(meet|call|text)\b/i)) {
      logger.debug('Using default time for action');
      return {
        hour: 10,
        minute: 0,
      };
    }

    logger.debug('No time pattern found');
    return null;
  } catch (error) {
    logger.error('Error parsing time of day:', error);
    return null;
  }
}

module.exports = { parse }; 