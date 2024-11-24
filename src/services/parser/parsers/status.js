const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('StatusParser');

/**
 * Parse status from text
 * @param {string} text - Input text
 * @returns {Object|null} Status object
 */
function parse(text) {
  try {
    // Check for blocked status with multiple blockers
    const blockersMatch = text.match(/blocked\s+by\s+([^,\.]+?)(?:\s+and\s+([^,\.]+))?/i);
    if (blockersMatch) {
      const [, blocker1, blocker2] = blockersMatch;
      if (blocker2) {
        return {
          status: 'blocked',
          blockers: [blocker1.trim(), blocker2.trim()],
        };
      }
      return {
        status: 'blocked',
        blocker: blocker1.trim(),
      };
    }

    // Check for progress percentage
    const progressMatch = text.match(CONFIG.statusPatterns.progress);
    if (progressMatch?.groups) {
      const status = text.match(CONFIG.statusPatterns.status);
      return {
        progress: parseInt(progressMatch.groups.progress, 10),
        ...(status?.groups && { status: status.groups.status.toLowerCase() }),
      };
    }

    // Check for status without blockers
    const statusMatch = text.match(CONFIG.statusPatterns.status);
    if (statusMatch?.groups) {
      return {
        status: statusMatch.groups.status.toLowerCase(),
      };
    }

    return null;
  } catch (error) {
    logger.error('Error parsing status:', error);
    return null;
  }
}

module.exports = { parse }; 