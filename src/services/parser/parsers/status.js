import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('StatusParser');

export default {
  name: 'status',
  parse(text) {
    try {
      const statusMatch = text.match(/\b(blocked|complete|started|closed|abandoned|pending)\b/i);
      if (statusMatch) {
        return {
          status: statusMatch[1].charAt(0).toUpperCase() + statusMatch[1].slice(1).toLowerCase()
        };
      }
      
      // Check for implicit pending status
      if (text.toLowerCase().includes('next') || text.toLowerCase().includes('tomorrow')) {
        return {
          status: 'Pending'
        };
      }

      return {
        status: 'None'
      };
    } catch (error) {
      logger.error('Error in status parser:', { error });
      return {
        status: 'None'
      };
    }
  }
};
