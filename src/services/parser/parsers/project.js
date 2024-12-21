import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ProjectParser');

export default {
    name: 'project',
    parse(text) {
        try {
            const projectPattern = /\bProject\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*)/;
            const aboutProjectPattern = /\babout\s+Project\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*)/;
            const reProjectPattern = /\bre\s+Project\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)*)/;

            let match = projectPattern.exec(text) || 
                       aboutProjectPattern.exec(text) || 
                       reProjectPattern.exec(text);

            if (match) {
                return {
                    type: 'project',
                    value: `Project ${match[1]}`
                };
            }

            return null;
        } catch (error) {
            logger.error('Error in project parser:', { error: error.message, stack: error.stack });
            return null;
        }
    }
};
