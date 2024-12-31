import { createLogger } from '../../../utils/logger.js';
import { parseDate } from '../utils/dateUtils.js';

const logger = createLogger('DateParser');

export default {
  name: 'date',
  parse(text) {
    logger.debug('Entering date parser', { text });
    try {
      // Match date patterns like "due: 2023-12-25" or "deadline: tomorrow"
      const dateMatch = text.match(/(?:due|deadline|date|on):\s*([^,\n]+)/i);
      if (dateMatch) {
        const dateStr = dateMatch[1].trim();
        const parsedDate = parseDate(dateStr);
        
        if (parsedDate) {
          const result = {
            date: parsedDate.toISOString()
          };
          logger.debug('Date parser found match', { result });
          return result;
        }
      }
      logger.debug('Date parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in date parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting date parser');
    }
  }
};
