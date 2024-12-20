import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('PatternUtils');

/**
 * Compile patterns for better performance
 * @param {Object} patterns - Raw patterns object
 * @returns {Map} Compiled patterns
 */
export function compilePatterns(patterns) {
  try {
    // Return empty Map if patterns is invalid
    if (!patterns || typeof patterns !== 'object') {
      return new Map();
    }

    const compiledPatterns = new Map();

    // Compile each pattern into a RegExp if it isn't already
    Object.entries(patterns).forEach(([key, pattern]) => {
      if (pattern instanceof RegExp) {
        compiledPatterns.set(key, pattern);
      } else if (typeof pattern === 'string') {
        compiledPatterns.set(key, new RegExp(pattern, 'i'));
      }
    });

    return compiledPatterns;
  } catch (error) {
    logger.error('Error compiling patterns:', { error });
    return new Map(); // Return empty Map on error
  }
}

/**
 * Validate pattern match
 * @param {Object} match - RegExp match result
 * @returns {boolean} Is valid match
 */
export function validatePatternMatch(match) {
  return Boolean(match && match.length > 0);
}
