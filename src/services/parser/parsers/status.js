import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('StatusParser');

export default {
  name: 'status',
  parse(text) {
    logger.debug('Entering status parser', { text });
    try {
      // Match status patterns like "status: in progress" or "state: completed"
      const statusMatch = text.match(/(?:status|state):\s*(not started|in progress|completed|done|blocked|on hold|pending|cancelled)\b/i);
      
      if (statusMatch) {
        let status = statusMatch[1].toLowerCase();
        
        // Normalize status values
        const statusMap = {
          'not started': 'not_started',
          'in progress': 'in_progress',
          'completed': 'completed',
          'done': 'completed',
          'blocked': 'blocked',
          'on hold': 'on_hold',
          'pending': 'pending',
          'cancelled': 'cancelled'
        };
        
        status = statusMap[status] || status;
        
        const result = { status };
        logger.debug('Status parser found match', { result });
        return result;
      }
      logger.debug('Status parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in status parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting status parser');
    }
  }
};
