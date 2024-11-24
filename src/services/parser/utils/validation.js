const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');
const { validateTime } = require('./timeUtils');

const logger = createLogger('ValidationUtils');

/**
 * Validate and set default values for parsed data
 * @param {Object} parsed - Parsed data object
 * @param {string} text - Original input text
 * @returns {Object} Validated and defaulted data
 */
function validateAndSetDefaults(parsed, text) {
  try {
    // Set default action if none found
    if (!parsed.action) {
      if (parsed.categories?.includes('calls')) {
        parsed.action = 'call';
      } else if (parsed.categories?.includes('meetings')) {
        parsed.action = 'meet';
      }
    }

    // Set default time of day to 10am for any action
    if (!parsed.timeOfDay && parsed.action) {
      parsed.timeOfDay = {
        hour: 10,
        minute: 0,
      };
    }

    // Set default reminder if action has one
    if (!parsed.reminders && parsed.action && CONFIG.defaultReminders[parsed.action]) {
      parsed.reminders = {
        reminderMinutes: CONFIG.defaultReminders[parsed.action],
        type: 'default',
      };
    }

    // Set default priority based on urgency
    if (!parsed.priority && parsed.urgency) {
      switch (parsed.urgency.level) {
        case 'immediate':
          parsed.priority = 'high';
          break;
        case 'today':
          parsed.priority = 'medium';
          break;
        case 'soon':
          parsed.priority = 'low';
          break;
      }
    }

    // Set priority from text indicators
    if (!parsed.priority) {
      if (/\b(urgent|asap|important)\b/i.test(text)) {
        parsed.priority = 'high';
      } else if (/\b(normal|moderate|regular)\b/i.test(text)) {
        parsed.priority = 'medium';
      } else if (/\b(low|minor|whenever)\b/i.test(text)) {
        parsed.priority = 'low';
      }
    }

    // Ensure categories is always an array
    if (!parsed.categories) {
      parsed.categories = [];
    }

    // Ensure status is properly formatted
    if (parsed.status && typeof parsed.status === 'string') {
      parsed.status = { status: parsed.status };
    }

    return parsed;
  } catch (error) {
    logger.error('Error validating and setting defaults:', error);
    return parsed;
  }
}

/**
 * Validate parsed result
 * @param {Object} result - Parsed result object
 * @returns {Object} Validation result with errors if any
 */
function validateResult(result) {
  try {
    const errors = [];

    // Validate time of day
    if (result.timeOfDay && !validateTime(result.timeOfDay)) {
      errors.push('Invalid time of day');
    }

    // Validate duration
    if (result.duration) {
      if (result.duration.minutes && result.duration.minutes <= 0) {
        errors.push('Duration must be positive');
      }
      if (result.duration.hours && result.duration.hours <= 0) {
        errors.push('Duration must be positive');
      }
    }

    // Validate reminders
    if (result.reminders?.reminderMinutes) {
      const minutes = Array.isArray(result.reminders.reminderMinutes) 
        ? result.reminders.reminderMinutes 
        : [result.reminders.reminderMinutes];
      
      if (minutes.some(m => m <= 0)) {
        errors.push('Reminder times must be positive');
      }
    }

    // Validate priority
    if (result.priority && !['high', 'medium', 'low'].includes(result.priority)) {
      errors.push('Invalid priority level');
    }

    // Validate progress
    if (result.status?.progress) {
      const progress = result.status.progress;
      if (progress < 0 || progress > 100) {
        errors.push('Progress must be between 0 and 100');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      result: errors.length === 0 ? result : null,
    };
  } catch (error) {
    logger.error('Error validating result:', error);
    return {
      isValid: false,
      errors: ['Internal validation error'],
      result: null,
    };
  }
}

module.exports = {
  validateAndSetDefaults,
  validateResult,
}; 