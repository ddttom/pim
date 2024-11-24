const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('SubjectParser');

/**
 * Parse subject from text
 * @param {string} text - Input text
 * @returns {Object|null} Subject object
 */
function parse(text) {
  try {
    // Try afterContact pattern first
    const afterContactMatch = text.match(/(?:with|to)\s+[A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)*(?:\s+and\s+[A-Z][a-z]+)?\s+(?:about|regarding)\s+([^,\.#]+?)(?=\s+(?:tomorrow|next|at|on|in|this|last|every|by|\$|#|,)|$)/i);
    if (afterContactMatch) {
      return {
        subject: afterContactMatch[1].trim(),
        type: 'afterContact',
      };
    }

    // Try about pattern
    const aboutMatch = text.match(/(?:about|regarding|re:|subject:)\s+([^,\.#]+?)(?=\s+(?:tomorrow|next|at|on|in|this|last|every|by|\$|#|,)|$)/i);
    if (aboutMatch) {
      return {
        subject: aboutMatch[1].trim(),
        type: 'about',
      };
    }

    // Try hashtags
    const hashtagPattern = new RegExp(CONFIG.subjectPatterns.hashtag, 'g');
    const tags = [...text.matchAll(hashtagPattern)]
      .map(match => match.groups.tag);
    if (tags.length > 0) {
      return { tags, type: 'hashtag' };
    }

    return null;
  } catch (error) {
    logger.error('Error parsing subject:', error);
    return null;
  }
}

module.exports = { parse }; 