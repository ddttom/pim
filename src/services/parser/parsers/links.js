import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('LinksParser');

export default {
  name: 'links',
  parse(text) {
    try {
      const urlRegex = /(https?:\/\/[^\s]+|file:\/\/[^\s]+)/g;
      return Array.from(text.matchAll(urlRegex), m => m[1]);
    } catch (error) {
      logger.error('Error in links parser:', { error });
      return [];
    }
  }
};
