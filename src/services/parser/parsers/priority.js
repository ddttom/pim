import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('PriorityParser');

export default {
  name: 'priority',
  parse(text) {
    logger.debug('Entering priority parser', { text });
    try {
      // Match priority patterns like "priority: high" or "p1"
      const priorityMatch = text.match(/(?:priority|p):\s*(high|medium|low|[1-3])\b/i) ||
                          text.match(/\b(?:p[1-3])\b/i);
      
      if (priorityMatch) {
        let priority = priorityMatch[1].toLowerCase();
        
        // Convert numeric priorities to text
        const priorityMap = {
          'p1': 'high',
          '1': 'high',
          'p2': 'medium',
          '2': 'medium',
          'p3': 'low',
          '3': 'low'
        };
        
        priority = priorityMap[priority] || priority;
        
        const result = { priority };
        logger.debug('Priority parser found match', { result });
        return result;
      }
      logger.debug('Priority parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in priority parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting priority parser');
    }
  }
};
