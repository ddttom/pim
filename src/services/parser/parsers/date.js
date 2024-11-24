const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');
const dateUtils = require('../utils/dateUtils');

const logger = createLogger('DateParser');

/**
 * Parse relative date from text
 */
function parseRelativeDate(text) {
  try {
    logger.debug('Starting relative date parse:', { text });
    const now = new Date();

    // Handle weekend cases first
    const weekendMatch = text.match(/(?:the\s+)?weekend\b/i);
    if (weekendMatch) {
      logger.debug('Found weekend pattern');
      const modifier = text.match(/\b(next)\s+(?:the\s+)?weekend\b/i)?.[1];
      return dateUtils.calculateWeekdayDate(now, 'saturday', modifier);
    }

    // Handle "last X of the month/year" cases
    const lastOfMatch = text.match(/(?:last|first)\s+(\w+)\s+of\s+the\s+(\w+)/i);
    if (lastOfMatch) {
      const [, dayName, timeframe] = lastOfMatch;
      logger.debug('Found last/first of pattern:', { dayName, timeframe });
      
      const targetDay = CONFIG.days.indexOf(dayName.toLowerCase());
      if (targetDay !== -1) {
        const result = dateUtils.findLastOccurrence(now, targetDay, timeframe);
        logger.debug('Last occurrence result:', { result: result?.toISOString() });
        return result;
      }
    }

    // Handle regular relative dates
    const match = text.match(CONFIG.patterns.timeExpression);
    if (!match?.groups) {
      logger.debug('No time expression match found');
      return null;
    }

    const { modifier, unit } = match.groups;
    logger.debug('Time expression match:', { modifier, unit });

    // Handle weekday cases
    if (CONFIG.days.includes(unit?.toLowerCase())) {
      logger.debug('Processing weekday:', { unit, modifier });
      const result = dateUtils.calculateWeekdayDate(now, unit, modifier);
      logger.debug('Weekday calculation result:', { result: result?.toISOString() });
      return result;
    }

    // Handle special cases
    switch (unit?.toLowerCase()) {
      case 'week':
        logger.debug('Processing week');
        return dateUtils.calculateWeekDate(now, modifier);
      case 'month':
        logger.debug('Processing month');
        return dateUtils.calculateMonthDate(now, modifier);
      case 'quarter':
        logger.debug('Processing quarter');
        return dateUtils.calculateQuarterDate(now, modifier);
      case 'year':
        logger.debug('Processing year');
        return dateUtils.calculateYearDate(now, modifier);
    }

    logger.debug('No matching date pattern found');
    return null;
  } catch (error) {
    logger.error('Error parsing relative date:', error);
    return null;
  }
}

module.exports = {
  parseRelativeDate,
}; 