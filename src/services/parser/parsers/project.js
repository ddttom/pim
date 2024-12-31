import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ProjectParser');

export default {
  name: 'project',
  parse(text) {
    logger.debug('Entering project parser', { text });
    try {
      // Match project patterns like "project: ProjectName" or "for ProjectName"
      const projectMatch = text.match(/(?:project|for):\s*([A-Z][a-zA-Z0-9_-]+)/i) ||
                         text.match(/\bfor\s+([A-Z][a-zA-Z0-9_-]+)(?=\s*(?:,|\.|$|\s+(?:about|with)))/);
      
      if (projectMatch) {
        const result = {
          project: projectMatch[1].trim()
        };
        logger.debug('Project parser found match', { result });
        return result;
      }
      logger.debug('Project parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in project parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting project parser');
    }
  }
};
