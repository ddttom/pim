import { createLogger } from '../../../utils/logger.js';
import { parseDate } from '../utils/dateUtils.js';

const logger = createLogger('RemindersParser');

export default {
  name: 'reminders',
  parse(text) {
    logger.debug('Entering reminders parser', { text });
    try {
      // Match reminder patterns like "remind: 1 hour before" or "reminder: 30 minutes before"
      const reminderMatch = text.match(/(?:remind(?:er)?|alert):\s*(\d+)\s*(hour|minute)s?\s*before/i);
      
      if (reminderMatch) {
        const count = parseInt(reminderMatch[1], 10);
        const unit = reminderMatch[2].toLowerCase();
        
        // Convert to minutes
        const minutes = unit === 'hour' ? count * 60 : count;
        
        const result = {
          reminder: {
            before: minutes
          }
        };
        logger.debug('Reminders parser found match', { result });
        return result;
      }
      
      // Match absolute reminder time like "remind: 9am"
      const timeMatch = text.match(/(?:remind(?:er)?|alert):\s*([^,\n]+)/i);
      if (timeMatch) {
        const reminderTime = parseDate(timeMatch[1].trim());
        if (reminderTime) {
          const result = {
            reminder: {
              at: reminderTime.toISOString()
            }
          };
          logger.debug('Reminders parser found time match', { result });
          return result;
        }
      }
      
      logger.debug('Reminders parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in reminders parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting reminders parser');
    }
  }
};
