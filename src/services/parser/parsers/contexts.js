import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ContextsParser');

const CONTEXT_PATTERNS = {
  work: /\b(?:client|project|deadline|team|meeting|review|office|work|business|presentation|report)\b/i,
  personal: /\b(?:family|home|personal|dinner|grocery|shopping|private)\b/i,
  health: /\b(?:doctor|health|medical|appointment|fitness|exercise|gym)\b/i,
  social: /\b(?:team building|social|party|celebration|meetup|gathering)\b/i,
  shopping: /\b(?:grocery|shopping|store|buy|purchase|market)\b/i,
  errands: /\b(?:errands|pickup|delivery|post office|bank)\b/i
};

export default {
  name: 'contexts',
  parse(text) {
    try {
      const contexts = new Set();
      
      // Check explicit context mentions
      for (const [context, pattern] of Object.entries(CONTEXT_PATTERNS)) {
        if (pattern.test(text)) {
          contexts.add(context);
        }
      }

      // Add shopping context for grocery-related tasks
      if (/\bgrocery\b/i.test(text)) {
        contexts.add('shopping');
        contexts.add('personal');
      }

      // Add personal context for family-related tasks
      if (/\b(?:family|home|personal)\b/i.test(text)) {
        contexts.add('personal');
      }

      // Add work context for office/business-related tasks
      if (/\b(?:office|work|business|client)\b/i.test(text)) {
        contexts.add('work');
      }
      
      return { contexts: Array.from(contexts) };
    } catch (error) {
      logger.error('Error in contexts parser:', { error });
      return { contexts: [] };
    }
  }
};
