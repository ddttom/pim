/**
 * Location Plugin for Natural Language Parser
 */
const { createLogger } = require('../utils/logger.js');

const logger = createLogger('LocationPlugin');

const locationPlugin = {
  name: 'location',
  version: '1.0.0',

  patterns: {
    building: /(?:building|floor)\s+(?<building>[A-Z0-9]+)/i,
    room: /(?:room|suite)\s+(?<room>[A-Z0-9-]+)/i,
    address: /(?<address>\d+[^,]+(?:Street|Avenue|Road|Lane|Drive))/i,
  },

  /**
   * Parse text for location information
   * @param {string} text - Text to parse
   * @returns {Object|null} Parsed location data or null on failure
   */
  parser: (text) => {
    logger.debug('Entering location parser', { text });
    try {
      const result = {};
      
      // Check each pattern
      for (const [type, pattern] of Object.entries(locationPlugin.patterns)) {
        logger.debug(`Checking ${type} pattern`);
        try {
          const match = text.match(pattern);
          if (match?.groups) {
            result[type] = match.groups[type];
            logger.debug(`Found ${type}`, { value: result[type] });
          }
        } catch (error) {
          logger.error(`Pattern matching failed for ${type}:`, { error, pattern });
          // Continue with other patterns
        }
      }

      const hasMatches = Object.keys(result).length > 0;
      if (hasMatches) {
        logger.debug('Location parsing complete', { result });
        return result;
      }

      logger.debug('No location matches found');
      return null;
    } catch (error) {
      logger.error('Location parsing failed:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting location parser');
    }
  },

  /**
   * Clean up any resources
   * @returns {boolean|null} Success status or null on failure
   */
  cleanup: () => {
    logger.debug('Starting location plugin cleanup');
    try {
      // Cleanup logic here (if needed)
      logger.debug('Location plugin cleanup complete');
      return true;
    } catch (error) {
      logger.error('Location plugin cleanup failed:', { error });
      return null;
    }
  }
};

module.exports = locationPlugin;
