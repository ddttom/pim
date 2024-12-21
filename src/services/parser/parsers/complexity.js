import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ComplexityParser');

const COMPLEXITY_LEVELS = {
    'simple': 1,
    'easy': 1,
    'medium': 2,
    'moderate': 2,
    'complex': 3,
    'difficult': 3,
    'hard': 3
};

export default {
    name: 'complexity',
    parse(text) {
        try {
            const complexityPattern = new RegExp(`\\b(${Object.keys(COMPLEXITY_LEVELS).join('|')})\\b`, 'i');
            const match = text.match(complexityPattern);

            if (match) {
                return {
                    type: 'complexity',
                    value: COMPLEXITY_LEVELS[match[1].toLowerCase()]
                };
            }

            return null;
        } catch (error) {
            logger.error('Error in complexity parser:', { error: error.message, stack: error.stack });
            return null;
        }
    }
};
