import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('PriorityParser');

export default {
  name: 'priority',
  parse(text) {
    try {
      if (/high priority|urgent(ly)?/i.test(text)) {
        return {
          priority: 'high'
        };
      }
      if (/low priority/i.test(text)) {
        return {
          priority: 'low'
        };
      }
      return {
        priority: 'normal'
      };
    } catch (error) {
      logger.error('Error in priority parser:', { error });
      return {
        priority: 'normal'
      };
    }
  }
};
