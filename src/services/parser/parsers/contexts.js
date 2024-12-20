import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ContextsParser');

export default {
  name: 'contexts',
  parse(text) {
    try {
      const contexts = [];
      
      // Work context
      if (/\b(?:client|project|deadline)\b/i.test(text)) {
        contexts.push('work');
      }
      
      // Personal context
      if (/\b(?:family|home|personal)\b/i.test(text)) {
        contexts.push('personal');
      }
      
      // Health context
      if (/\b(?:doctor|health|medical)\b/i.test(text)) {
        contexts.push('health');
      }
      
      return contexts;
    } catch (error) {
      logger.error('Error in contexts parser:', { error });
      return [];
    }
  }
};
