import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ContextsParser');

export default {
  name: 'contexts',
  parse(text) {
    logger.debug('Entering contexts parser', { text });
    try {
      const contextMatches = Array.from(text.matchAll(/@(\w+)/g));
      if (contextMatches.length > 0) {
        const contexts = contextMatches.map(match => match[1].toLowerCase());
        const result = {
          contexts: [...new Set(contexts)] // Remove duplicates
        };
        logger.debug('Contexts parser found matches', { result });
        return result;
      }
      logger.debug('Contexts parser found no matches');
      return null;
    } catch (error) {
      logger.error('Error in contexts parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting contexts parser');
    }
  }
};
