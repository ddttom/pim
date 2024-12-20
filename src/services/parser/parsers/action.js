import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ActionParser');

export default {
  name: 'action',
  parse(text) {
    try {
      const actionMatch = text.match(/^(call|text|meet|email)\b/i);
      if (actionMatch) {
        return {
          action: actionMatch[1].toLowerCase()
        };
      }
      return null;
    } catch (error) {
      logger.error('Error in action parser:', { error });
      return null;
    }
  }
};
