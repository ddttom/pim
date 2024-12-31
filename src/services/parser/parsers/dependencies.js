import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('DependenciesParser');

export default {
  name: 'dependencies',
  parse(text) {
    logger.debug('Entering dependencies parser', { text });
    try {
      // Match dependencies like "depends on: #123, #456" or "after: #789"
      const dependencyMatch = text.match(/(?:depends on|after|requires):\s*((?:#\d+(?:\s*,\s*#\d+)*)|(?:\d+(?:\s*,\s*\d+)*))/i);
      if (dependencyMatch) {
        // Extract and clean up dependency IDs
        const deps = dependencyMatch[1]
          .split(',')
          .map(id => id.trim().replace('#', ''))
          .map(id => parseInt(id, 10))
          .filter(id => !isNaN(id));

        if (deps.length > 0) {
          const result = {
            dependencies: deps
          };
          logger.debug('Dependencies parser found matches', { result });
          return result;
        }
      }
      logger.debug('Dependencies parser found no matches');
      return null;
    } catch (error) {
      logger.error('Error in dependencies parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting dependencies parser');
    }
  }
};
