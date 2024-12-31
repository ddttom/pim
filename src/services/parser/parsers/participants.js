import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ParticipantsParser');

export default {
  name: 'participants',
  parse(text) {
    logger.debug('Entering participants parser', { text });
    try {
      // Match participants list after "participants:" or "with:"
      const participantsMatch = text.match(/(?:participants|with):\s*((?:[A-Z][a-z]+(?:\s*,\s*|\s+and\s+)?)+)(?=\s*(?:,|\.|$|\s+(?:about|for)))/i);
      if (participantsMatch) {
        const participants = participantsMatch[1]
          .split(/\s*,\s*|\s+and\s+/)
          .map(name => name.trim())
          .filter(name => name.length > 0);

        if (participants.length > 0) {
          const result = {
            participants: [...new Set(participants)] // Remove duplicates
          };
          logger.debug('Participants parser found matches', { result });
          return result;
        }
      }
      logger.debug('Participants parser found no matches');
      return null;
    } catch (error) {
      logger.error('Error in participants parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting participants parser');
    }
  }
};
