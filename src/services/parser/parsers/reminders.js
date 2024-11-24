const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');
const { convertToMinutes } = require('../utils/timeUtils');

const logger = createLogger('RemindersParser');

/**
 * Parse reminders from text
 * @param {string} text - Input text
 * @returns {Object|null} Reminder object
 */
function parse(text) {
  try {
    // Check for multiple reminders
    const multipleMatch = text.match(/(?:remind|alert)\s+me\s+(\d+)\s*(hour|hr|minute|min)s?\s+before\s+and\s+(\d+)\s*(hour|hr|minute|min)s?\s+before/i);
    if (multipleMatch) {
      const [, time1, unit1, time2, unit2] = multipleMatch;
      return {
        reminderMinutes: [
          convertToMinutes(parseInt(time1, 10), unit1),
          convertToMinutes(parseInt(time2, 10), unit2),
        ],
        type: 'custom',
      };
    }

    // Check for single reminder with days
    const dayMatch = text.match(/(?:remind|alert)\s+me\s+(\d+)\s*(?:day|days)\s+before/i);
    if (dayMatch) {
      return {
        reminderMinutes: 1440 * parseInt(dayMatch[1], 10),
        type: 'custom',
      };
    }

    // Check for single reminder with hours/minutes
    const singleMatch = text.match(/(?:remind|alert)\s+me\s+(\d+)\s*(hour|hr|minute|min)s?\s+before/i);
    if (singleMatch) {
      const [, time, unit] = singleMatch;
      return {
        reminderMinutes: convertToMinutes(parseInt(time, 10), unit),
        type: 'custom',
      };
    }

    // Check for default reminder
    if (text.includes('with reminder')) {
      return {
        reminderMinutes: 15,
        type: 'default',
      };
    }

    return null;
  } catch (error) {
    logger.error('Error parsing reminders:', error);
    return null;
  }
}

module.exports = { parse }; 