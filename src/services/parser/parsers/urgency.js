import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('UrgencyParser');

export default {
  name: 'urgency',
  parse(text) {
    logger.debug('Entering urgency parser', { text });
    try {
      // Match urgency patterns like "urgency: high" or "urgent"
      const urgencyMatch = text.match(/(?:urgency|urgent):\s*(high|medium|low)\b/i) ||
                          text.match(/\b(urgent|asap|critical)\b/i);
      
      if (urgencyMatch) {
        let urgency = urgencyMatch[1].toLowerCase();
        
        // Map urgency values
        const urgencyMap = {
          'urgent': 'high',
          'asap': 'high',
          'critical': 'high',
          'high': 'high',
          'medium': 'medium',
          'low': 'low'
        };
        
        urgency = urgencyMap[urgency] || urgency;
        
        const result = { urgency };
        logger.debug('Urgency parser found match', { result });
        return result;
      }
      logger.debug('Urgency parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in urgency parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting urgency parser');
    }
  }
};
