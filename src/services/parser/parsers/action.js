import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ActionParser');

export default {
  name: 'action',
  parse(text) {
    logger.debug('Entering action parser', { text });
    try {
      const actionMatch = text.match(/^(call|text|meet|email)\b/i);
      if (actionMatch) {
        const result = {
          action: actionMatch[1].toLowerCase()
        };
        logger.debug('Action parser found match', { result });
        return result;
      }
      logger.debug('Action parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in action parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting action parser');
    }
  }
};
