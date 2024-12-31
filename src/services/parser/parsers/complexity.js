import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ComplexityParser');

export default {
  name: 'complexity',
  parse(text) {
    logger.debug('Entering complexity parser', { text });
    try {
      const complexityMatch = text.match(/complexity:\s*(low|medium|high|simple|complex|very complex)\b/i);
      if (complexityMatch) {
        const complexityMap = {
          'low': 'low',
          'simple': 'low',
          'medium': 'medium',
          'high': 'high',
          'complex': 'high',
          'very complex': 'high'
        };
        const result = {
          complexity: complexityMap[complexityMatch[1].toLowerCase()]
        };
        logger.debug('Complexity parser found match', { result });
        return result;
      }
      logger.debug('Complexity parser found no match');
      return null;
    } catch (error) {
      logger.error('Error in complexity parser:', { error, text });
      return null;
    } finally {
      logger.debug('Exiting complexity parser');
    }
  }
};
