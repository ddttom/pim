import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ContactParser');

export default {
  name: 'contact',
  parse(text) {
    logger.debug('Entering contact parser', { text });
    try {
      // Match email addresses
      const emailMatch = text.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
      
      // Match phone numbers (various formats)
      const phoneMatch = text.match(/\b(\+?1?\s*[-.]?\s*\(?[0-9]{3}\)?\s*[-.]?\s*[0-9]{3}\s*[-.]?\s*[0-9]{4})\b/);
      
      if (emailMatch || phoneMatch) {
        const result = {
          contact: {
            email: emailMatch ? emailMatch[1] : null,
            phone: phoneMatch ? phoneMatch[1].replace(/[\s.-]/g, '') : null
          }
        };
        logger.debug('Contact parser found match', { result });
        return result;
      }
      
      logger.debug('Contact parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in contact parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting contact parser');
    }
  }
};
