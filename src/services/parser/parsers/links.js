import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('LinksParser');

export default {
  name: 'links',
  parse(text) {
    try {
      const urlPattern = /(https?:\/\/[^\s]+|file:\/\/[^\s]+)/g;
      const matches = text.match(urlPattern) || [];
      
      return {
        type: 'links',
        value: matches
      };
    } catch (error) {
      logger.error('Error in links parser:', { error: error.message, stack: error.stack });
      return null;
    }
  }
};
