import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ParticipantsParser');

export default {
  name: 'participants',
  parse(text) {
    try {
      const participantRegex = /@(\w+)/g;
      const matches = Array.from(text.matchAll(participantRegex), m => m[1]);
      return [...new Set(matches)]; // Remove duplicates
    } catch (error) {
      logger.error('Error in participants parser:', { error });
      return [];
    }
  }
};
