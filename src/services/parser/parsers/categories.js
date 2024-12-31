import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('CategoriesParser');

export default {
  name: 'categories',
  parse(text) {
    logger.debug('Entering categories parser', { text });
    try {
      const categoryMatch = text.match(/category:\s*([^,\n]+)/i);
      if (categoryMatch) {
        const result = {
          category: categoryMatch[1].trim().toLowerCase()
        };
        logger.debug('Categories parser found match', { result });
        return result;
      }
      logger.debug('Categories parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in categories parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting categories parser');
    }
  }
};
