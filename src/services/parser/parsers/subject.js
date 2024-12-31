import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('SubjectParser');

export default {
  name: 'subject',
  parse(text) {
    logger.debug('Entering subject parser', { text });
    try {
      // Match subject patterns like "subject: Meeting Discussion" or "re: Project Update"
      const subjectMatch = text.match(/(?:subject|re|about):\s*([^,\n]+)/i);
      
      if (subjectMatch) {
        const result = {
          subject: subjectMatch[1].trim()
        };
        logger.debug('Subject parser found match', { result });
        return result;
      }
      
      // Also try to extract first line as subject if it's a short phrase
      const firstLine = text.split(/[\n\r]/)[0].trim();
      if (firstLine && firstLine.length <= 100 && !firstLine.includes(':')) {
        const result = {
          subject: firstLine
        };
        logger.debug('Subject parser extracted first line', { result });
        return result;
      }
      
      logger.debug('Subject parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in subject parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting subject parser');
    }
  }
};
