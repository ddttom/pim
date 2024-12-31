import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('DurationParser');

export default {
  name: 'duration',
  parse(text) {
    logger.debug('Entering duration parser', { text });
    try {
      // Match patterns like "duration: 2h 30m" or "takes: 45m"
      const durationMatch = text.match(/(?:duration|takes|length):\s*(?:(\d+)\s*h(?:ours?)?)?(?:\s*(\d+)\s*m(?:in(?:utes?)?)?)?/i);
      if (durationMatch) {
        const hours = durationMatch[1] ? parseInt(durationMatch[1], 10) : 0;
        const minutes = durationMatch[2] ? parseInt(durationMatch[2], 10) : 0;
        
        if (hours > 0 || minutes > 0) {
          const totalMinutes = (hours * 60) + minutes;
          const result = {
            duration: totalMinutes
          };
          logger.debug('Duration parser found match', { result });
          return result;
        }
      }
      logger.debug('Duration parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in duration parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting duration parser');
    }
  }
};
