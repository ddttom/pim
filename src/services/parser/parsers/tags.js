import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('TagsParser');

export default {
  name: 'tags',
  parse(text) {
    try {
      const tagRegex = /#(\w+(?:-\w+)*)/g;
      const matches = Array.from(text.matchAll(tagRegex), m => m[1]);
      return matches.length > 0 ? matches : [];
    } catch (error) {
      logger.error('Error in tags parser:', { error });
      return [];
    }
  }
};
