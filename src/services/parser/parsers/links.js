// Parser for extracting URLs from text content
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('LinksParser');

// URL regex pattern that matches http/https URLs
const URL_PATTERN = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi;

const parse = (text) => {
  try {
    if (!text) return [];
    
    // Extract all URLs from the text
    const links = text.match(URL_PATTERN);
    
    logger.debug('Found links:', { linkCount: links?.length || 0 });
    
    return links || [];
  } catch (error) {
    logger.error('Error parsing links:', error);
    return [];
  }
};

module.exports = {
  parse,
}; 