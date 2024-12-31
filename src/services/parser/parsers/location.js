import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('LocationParser');

export default {
  name: 'location',
  parse(text) {
    logger.debug('Entering location parser', { text });
    try {
      // Match location patterns like "at: Office" or "location: Conference Room B"
      const locationMatch = text.match(/(?:at|location|place|venue):\s*([^,\n]+)/i);
      if (locationMatch) {
        const result = {
          location: locationMatch[1].trim()
        };
        logger.debug('Location parser found match', { result });
        return result;
      }
      
      // Also match "in Location" pattern
      const inMatch = text.match(/\bin\s+([A-Z][^,\n]+?)(?=\s*(?:,|\.|$|\s+(?:at|on|with)))/);
      if (inMatch) {
        const result = {
          location: inMatch[1].trim()
        };
        logger.debug('Location parser found "in" match', { result });
        return result;
      }
      
      logger.debug('Location parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in location parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting location parser');
    }
  }
};
