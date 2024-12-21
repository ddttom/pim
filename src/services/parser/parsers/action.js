import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ActionParser');

const ACTIONS = [
  'call', 'email', 'meet', 'review', 'follow up', 'schedule', 'book', 
  'arrange', 'organize', 'plan', 'prepare', 'write', 'draft', 'create',
  'make', 'do', 'check', 'verify', 'confirm', 'send', 'share', 'update',
  'modify', 'change', 'delete', 'remove', 'add', 'text'
];

const ACTION_PATTERN = new RegExp(`\\b(${ACTIONS.join('|')})\\b`, 'i');

export default {
  name: 'action',
  parse(text) {
    try {
      const actionMatch = text.match(ACTION_PATTERN);
      return actionMatch ? {
        action: actionMatch[1].toLowerCase()
      } : null;
    } catch (error) {
      logger.error('Error in action parser:', { error });
      return null;
    }
  }
};
