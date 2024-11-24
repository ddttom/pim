const logger = require('../../../utils/logger');

// URL regex pattern
const URL_PATTERN = /https?:\/\/[^\s]+/g;

class LinksParser {
  parse(text) {
    try {
      if (!text || typeof text !== 'string') {
        return [];
      }

      // Extract URLs from text
      const matches = text.match(URL_PATTERN);
      
      // Return array of URLs or empty array if no matches
      return matches || [];

    } catch (error) {
      logger.error('Error in links parser:', { error });
      return [];
    }
  }
}

module.exports = new LinksParser(); 