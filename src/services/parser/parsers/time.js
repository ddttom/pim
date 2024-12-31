import { createLogger } from '../../../utils/logger.js';
import { parseTime } from '../utils/timeUtils.js';

const logger = createLogger('TimeParser');

export default {
  name: 'time',
  parse(text) {
    logger.debug('Entering time parser', { text });
    try {
      // Match time patterns like "time: 3:30pm" or "at 15:00"
      const timeMatch = text.match(/(?:time|at):\s*([^,\n]+)/i) ||
                       text.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
      
      if (timeMatch) {
        const timeStr = timeMatch[1].trim();
        const parsedTime = parseTime(timeStr);
        
        if (parsedTime) {
          const result = {
            time: parsedTime.toISOString()
          };
          logger.debug('Time parser found match', { result });
          return result;
        }
      }
      logger.debug('Time parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in time parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting time parser');
    }
  }
};
