import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('TimeOfDayParser');

export default {
  name: 'timeOfDay',
  parse(text) {
    logger.debug('Entering timeOfDay parser', { text });
    try {
      // Match time of day patterns like "in the morning" or "during afternoon"
      const timeOfDayMatch = text.match(/\b(?:in|during)\s+(?:the\s+)?(morning|afternoon|evening|night)\b/i);
      
      if (timeOfDayMatch) {
        const period = timeOfDayMatch[1].toLowerCase();
        
        // Map periods to time ranges
        const periodMap = {
          'morning': { start: '06:00', end: '12:00' },
          'afternoon': { start: '12:00', end: '17:00' },
          'evening': { start: '17:00', end: '21:00' },
          'night': { start: '21:00', end: '06:00' }
        };
        
        const result = {
          timeOfDay: periodMap[period]
        };
        logger.debug('TimeOfDay parser found match', { result });
        return result;
      }
      logger.debug('TimeOfDay parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in timeOfDay parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting timeOfDay parser');
    }
  }
};
