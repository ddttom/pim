import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('RecurringParser');

export default {
  name: 'recurring',
  parse(text) {
    logger.debug('Entering recurring parser', { text });
    try {
      // Match recurring patterns like "repeat: daily" or "recurring: weekly"
      const recurringMatch = text.match(/(?:repeat|recurring|every):\s*(daily|weekly|monthly|yearly|(\d+)\s*(?:days?|weeks?|months?|years?))/i);
      
      if (recurringMatch) {
        let interval = recurringMatch[1].toLowerCase();
        let frequency;
        
        // Handle numeric intervals
        if (recurringMatch[2]) {
          const count = parseInt(recurringMatch[2], 10);
          const unit = interval.replace(/^[0-9\s]+/, '').replace(/s$/, '');
          frequency = {
            count,
            unit
          };
        } else {
          // Convert text intervals to frequency object
          const frequencyMap = {
            'daily': { count: 1, unit: 'day' },
            'weekly': { count: 1, unit: 'week' },
            'monthly': { count: 1, unit: 'month' },
            'yearly': { count: 1, unit: 'year' }
          };
          frequency = frequencyMap[interval];
        }
        
        if (frequency) {
          const result = { recurring: frequency };
          logger.debug('Recurring parser found match', { result });
          return result;
        }
      }
      logger.debug('Recurring parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in recurring parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting recurring parser');
    }
  }
};
