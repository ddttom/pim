const { createLogger } = require('../../../utils/logger');

const logger = createLogger('PatternUtils');

/**
 * Compile patterns for better performance
 * @param {Object} patterns - Raw patterns object
 * @returns {Object} Compiled patterns
 */
function compilePatterns(patterns) {
  try {
    const compiled = {};
    
    // Compile base patterns
    for (const [key, pattern] of Object.entries(patterns)) {
      compiled[key] = new RegExp(pattern, 'i');
    }
    
    // Compile priority patterns
    compiled.priorityPatterns = {};
    for (const [key, pattern] of Object.entries(patterns.priorityPatterns)) {
      compiled.priorityPatterns[key] = new RegExp(pattern, 'i');
    }
    
    // Compile location patterns
    compiled.locationPatterns = {};
    for (const [key, pattern] of Object.entries(patterns.locationPatterns)) {
      compiled.locationPatterns[key] = new RegExp(pattern, 'i');
    }
    
    // Compile status patterns
    compiled.statusPatterns = {};
    for (const [key, pattern] of Object.entries(patterns.statusPatterns)) {
      compiled.statusPatterns[key] = new RegExp(pattern, 'i');
    }
    
    return compiled;
  } catch (error) {
    logger.error('Error compiling patterns:', error);
    return patterns;
  }
}

/**
 * Validate pattern match
 * @param {Object} match - RegExp match result
 * @param {string} patternName - Name of the pattern
 * @returns {boolean} Is valid match
 */
function validatePatternMatch(match, patternName) {
  try {
    if (!match) {
      return false;
    }

    if (match.groups) {
      const requiredGroups = {
        timeExpression: ['modifier', 'unit'],
        time: ['hours'],
        duration: ['amount', 'unit'],
      };

      const required = requiredGroups[patternName];
      if (required) {
        return required.every(group => 
          match.groups[group] !== undefined && 
          match.groups[group] !== null
        );
      }
    }

    return true;
  } catch (error) {
    logger.error('Error validating pattern match:', error);
    return false;
  }
}

module.exports = {
  compilePatterns,
  validatePatternMatch,
}; 