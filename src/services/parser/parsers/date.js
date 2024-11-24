const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');
const dateUtils = require('../utils/dateUtils');

const logger = createLogger('DateParser');

/**
 * Parse relative date from text
 */
function parseRelativeDate(text) {
  try {
    const now = new Date();
    const match = text.match(CONFIG.patterns.timeExpression);

    if (!match?.groups) {
      return null;
    }

    const { modifier, unit, timeframe } = match.groups;

    // Handle weekday cases
    if (CONFIG.days.includes(unit?.toLowerCase())) {
      return dateUtils.calculateWeekdayDate(now, unit, modifier);
    }

    // Handle special cases
    switch (unit?.toLowerCase()) {
      case 'week':
        return dateUtils.calculateWeekDate(now, modifier);
      case 'month':
        return dateUtils.calculateMonthDate(now, modifier);
      case 'quarter':
        return dateUtils.calculateQuarterDate(now, modifier);
      case 'year':
        return dateUtils.calculateYearDate(now, modifier);
      case 'weekend':
        return dateUtils.calculateWeekdayDate(now, 'saturday', modifier);
    }

    // Handle "of the month/year" cases
    if (timeframe) {
      const dayMatch = text.match(/(\w+)\s+of\s+the/i);
      if (dayMatch) {
        const targetDay = CONFIG.days.indexOf(dayMatch[1].toLowerCase());
        if (targetDay !== -1) {
          return dateUtils.findLastOccurrence(now, targetDay, timeframe);
        }
      }
    }

    return null;
  } catch (error) {
    logger.error('Error parsing relative date:', error);
    return null;
  }
}

module.exports = {
  parseRelativeDate,
}; 