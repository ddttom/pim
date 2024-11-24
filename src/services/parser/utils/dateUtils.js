const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('DateUtils');

/**
 * Normalize and validate date result
 * @private
 */
function normalizeDateResult(date, type, input) {
  if (!(date instanceof Date) || isNaN(date)) {
    logger.error(`Invalid date result for ${type}:`, { input, date });
    return null;
  }
  return date;
}

/**
 * Preprocess weekend text
 */
function preprocessWeekend(text) {
  try {
    logger.debug('Preprocessing weekend text:', text);
    return text.replace(/\b(?:the\s+)?weekend\b/i, (match, offset, string) => {
      if (string.includes('next')) {
        logger.debug('Converting "next weekend" to "next saturday"');
        return 'next saturday';
      }
      logger.debug('Converting "weekend" to "saturday"');
      return 'saturday';
    });
  } catch (error) {
    logger.error('Error preprocessing weekend text:', error);
    return text;
  }
}

/**
 * Calculate weekday date
 */
function calculateWeekdayDate(now, dayName, modifier) {
  try {
    logger.debug('Calculating weekday date:', { dayName, modifier });
    
    const targetDay = CONFIG.days.indexOf(dayName.toLowerCase());
    const currentDay = now.getDay();
    
    if (targetDay === -1) {
      logger.error('Invalid day name:', dayName);
      return null;
    }

    let diff = targetDay - currentDay;
    logger.debug('Initial day difference:', diff);

    switch (modifier) {
      case 'next':
        // Always add 7 days to ensure it's next week
        diff += 7;
        if (dayName.toLowerCase() === 'saturday' && text.includes('weekend')) {
          diff += 7; // Add another week for "next weekend"
        }
        break;
      case 'last':
        // Ensure it's in the past week
        diff = diff <= 0 ? diff - 7 : diff - 14;
        break;
      default: // 'this' or no modifier
        // If the day has passed this week, move to next week
        if (diff <= 0 && modifier !== 'last') {
          diff += 7;
        }
    }

    logger.debug('Final day difference:', diff);

    const result = new Date(now);
    result.setDate(now.getDate() + diff);
    
    return normalizeDateResult(result, 'weekday', { dayName, modifier });
  } catch (error) {
    logger.error('Error calculating weekday date:', error);
    return null;
  }
}

/**
 * Calculate week date
 */
function calculateWeekDate(now, modifier) {
  try {
    const result = new Date(now);
    const daysToAdd = modifier === 'next' ? 7 : -7;
    result.setDate(now.getDate() + daysToAdd);
    return result;
  } catch (error) {
    logger.error('Error calculating week date:', error);
    return null;
  }
}

/**
 * Calculate month date
 */
function calculateMonthDate(now, modifier) {
  try {
    const result = new Date(now);
    switch (modifier) {
      case 'next':
        result.setMonth(now.getMonth() + 1, 1);
        break;
      case 'last':
        result.setMonth(now.getMonth() - 1, 1);
        break;
      case CONFIG.dateModifiers.endOf:
        result.setMonth(now.getMonth() + 1, 0);
        break;
      case CONFIG.dateModifiers.beginningOf:
        result.setDate(1);
        break;
      default:
        return null;
    }
    return result;
  } catch (error) {
    logger.error('Error calculating month date:', error);
    return null;
  }
}

/**
 * Calculate quarter date
 */
function calculateQuarterDate(now, modifier) {
  try {
    const result = new Date(now);
    const currentQuarter = Math.floor(now.getMonth() / 3);
    
    switch (modifier) {
      case 'next':
        result.setMonth((currentQuarter + 1) * 3, 1);
        break;
      case 'last':
        result.setMonth((currentQuarter - 1) * 3, 1);
        break;
      case CONFIG.dateModifiers.endOf:
        result.setMonth(currentQuarter * 3 + 3, 0);
        break;
      case CONFIG.dateModifiers.beginningOf:
        result.setMonth(currentQuarter * 3, 1);
        break;
      default:
        return null;
    }
    return result;
  } catch (error) {
    logger.error('Error calculating quarter date:', error);
    return null;
  }
}

/**
 * Calculate year date
 */
function calculateYearDate(now, modifier) {
  try {
    const result = new Date(now);
    switch (modifier) {
      case 'next':
        result.setFullYear(now.getFullYear() + 1, 0, 1);
        break;
      case 'last':
        result.setFullYear(now.getFullYear() - 1, 0, 1);
        break;
      case CONFIG.dateModifiers.endOf:
        result.setFullYear(now.getFullYear(), 11, 31);
        break;
      case CONFIG.dateModifiers.beginningOf:
        result.setMonth(0, 1);
        break;
      default:
        return null;
    }
    return result;
  } catch (error) {
    logger.error('Error calculating year date:', error);
    return null;
  }
}

/**
 * Find last occurrence of a weekday in month
 */
function findLastWeekdayInMonth(now, targetDay) {
  try {
    logger.debug('Finding last weekday in month:', { targetDay });
    
    // Get the last day of the current month
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const result = new Date(lastDay);
    
    // Walk backwards until we find the target day
    while (result.getDay() !== targetDay) {
      result.setDate(result.getDate() - 1);
    }
    
    logger.debug('Found last weekday:', result.toISOString());
    return normalizeDateResult(result, 'lastWeekday', { targetDay });
  } catch (error) {
    logger.error('Error finding last weekday in month:', error);
    return null;
  }
}

/**
 * Find last occurrence
 */
function findLastOccurrence(now, targetDay, timeframe) {
  try {
    logger.debug('Finding last occurrence:', { targetDay, timeframe });
    let result = new Date(now);
    
    switch (timeframe) {
      case 'month':
        return findLastWeekdayInMonth(now, targetDay);
      case 'quarter': {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        result.setMonth((currentQuarter + 1) * 3, 0);
        break;
      }
      case 'year': {
        result.setMonth(11, 31);
        break;
      }
      default:
        logger.error('Invalid timeframe:', timeframe);
        return null;
    }

    while (result.getDay() !== targetDay) {
      result.setDate(result.getDate() - 1);
    }

    return normalizeDateResult(result, 'lastOccurrence', { targetDay, timeframe });
  } catch (error) {
    logger.error('Error finding last occurrence:', error);
    return null;
  }
}

module.exports = {
  preprocessWeekend,
  calculateWeekdayDate,
  calculateWeekDate,
  calculateMonthDate,
  calculateQuarterDate,
  calculateYearDate,
  findLastOccurrence,
  findLastWeekdayInMonth,
}; 