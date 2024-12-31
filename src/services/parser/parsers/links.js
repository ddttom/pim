import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('LinksParser');

export default {
  name: 'links',
  parse(text) {
    logger.debug('Entering links parser', { text });
    try {
      // Match URLs with or without protocol
      const urlRegex = /\b(?:https?:\/\/)?(?:[\w-]+\.)+[a-z]{2,}(?:\/[^\s]*)?/gi;
      const matches = Array.from(text.matchAll(urlRegex));
      
      if (matches.length > 0) {
        const links = matches.map(match => {
          let url = match[0];
          // Add protocol if missing
          if (!url.startsWith('http')) {
            url = 'https://' + url;
          }
          return url;
        });
        
        const result = {
          links: [...new Set(links)] // Remove duplicates
        };
        logger.debug('Links parser found matches', { result });
        return result;
      }
      logger.debug('Links parser found no matches');
      return null;
    } catch (error) {
      logger.error('Error in links parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting links parser');
    }
  }
};
