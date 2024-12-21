import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('PriorityParser');

const PRIORITY_LEVELS = {
    'urgent': 'high',
    'high': 'high',
    'medium': 'medium',
    'normal': 'normal',
    'low': 'low'
};

export default {
    name: 'priority',
    parse(text) {
        try {
            const priorityPattern = new RegExp(`\\b(${Object.keys(PRIORITY_LEVELS).join('|')})\\b`, 'i');
            const match = text.match(priorityPattern);

            if (match) {
                return {
                    type: 'priority',
                    value: PRIORITY_LEVELS[match[1].toLowerCase()]
                };
            }

            return null;
        } catch (error) {
            logger.error('Error in priority parser:', { error: error.message, stack: error.stack });
            return null;
        }
    }
};
