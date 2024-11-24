const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('LocationParser');

/**
 * Parse location from text
 * @param {string} text - Input text
 * @returns {Object|null} Location object
 */
function parse(text) {
  try {
    // Check for online meeting with link
    const onlineMatch = text.match(/(\w+)\s+meeting\s+at\s+(https?:\/\/[^\s]+)/i);
    if (onlineMatch) {
      return {
        type: 'online',
        value: onlineMatch[1].toLowerCase(),
        link: onlineMatch[2],
      };
    }

    // Check for office location
    const officeMatch = text.match(/\bin\s+the\s+office\b/i);
    if (officeMatch) {
      return {
        type: 'office',
        value: 'office',
      };
    }

    // Check for complex office location
    const complexMatch = text.match(/in\s+([A-Za-z\s]+(?:Office|Building)(?:\s+Room\s+\d+)?)/i);
    if (complexMatch) {
      return {
        type: 'travel',
        value: complexMatch[1].trim(),
      };
    }

    // Check for city/location
    const cityMatch = text.match(/\bin\s+([A-Za-z][A-Za-z\s]+)(?=\s|$)/i);
    if (cityMatch) {
      return {
        type: 'travel',
        value: cityMatch[1].trim(),
      };
    }

    // Check other patterns from config
    for (const [type, pattern] of Object.entries(CONFIG.locationPatterns)) {
      const match = text.match(pattern);
      if (match?.groups) {
        return {
          type,
          value: match.groups.location || match.groups.platform || type,
          ...(match.groups.room && { room: match.groups.room }),
          ...(match.groups.link && { link: match.groups.link }),
        };
      }
    }

    return null;
  } catch (error) {
    logger.error('Error parsing location:', error);
    return null;
  }
}

module.exports = { parse }; 