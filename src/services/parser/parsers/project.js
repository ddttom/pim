const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('ProjectParser');

/**
 * Parse project from text
 * @param {string} text - Input text
 * @returns {Object|null} Project object
 */
function parse(text) {
  try {
    const result = {};

    // Parse Digital Transformation Project format first
    const transformationMatch = text.match(/(?:for\s+)?([A-Za-z][A-Za-z\s]+?Project)(?=\s+(?:tomorrow|next|at|on|in|this|last|every|by|\$|#|,)|$)/i);
    if (transformationMatch) {
      result.project = transformationMatch[1].trim();
      return result;
    }

    // Parse Project Name format
    const projectMatch = text.match(/(?:for\s+)?(?:Project|project)\s+([A-Za-z][A-Za-z\s]+?)(?=\s+(?:tomorrow|next|at|on|in|this|last|every|by|\$|#|,)|$)/i);
    if (projectMatch) {
      result.project = `Project ${projectMatch[1].trim()}`;
      return result;
    }

    // Parse contexts
    const contextPattern = new RegExp(CONFIG.projectPatterns.context, 'g');
    const contexts = [...text.matchAll(contextPattern)]
      .map(match => match.groups.context);
    if (contexts.length > 0) {
      result.contexts = contexts;
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    logger.error('Error parsing project:', error);
    return null;
  }
}

module.exports = { parse }; 