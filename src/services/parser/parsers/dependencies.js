import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('DependenciesParser');

export default {
    name: 'dependencies',
    parse(text) {
        try {
            const dependencyPattern = /\b(?:after|depends on|requires|needs?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;
            const matches = text.match(dependencyPattern);

            if (matches) {
                return {
                    type: 'dependencies',
                    value: matches[1].trim()
                };
            }

            return null;
        } catch (error) {
            logger.error('Error in dependencies parser:', { error: error.message, stack: error.stack });
            return null;
        }
    }
};
