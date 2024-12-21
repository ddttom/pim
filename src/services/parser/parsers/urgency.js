import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('UrgencyParser');

const URGENCY_LEVELS = {
    'asap': 'high',
    'urgent': 'high',
    'soon': 'medium',
    'whenever': 'low',
    'eventually': 'low'
};

export default {
    name: 'urgency',
    parse(text) {
        try {
            const urgencyPattern = new RegExp(`\\b(${Object.keys(URGENCY_LEVELS).join('|')})\\b`, 'i');
            const match = text.match(urgencyPattern);

            if (match) {
                return {
                    type: 'urgency',
                    value: URGENCY_LEVELS[match[1].toLowerCase()]
                };
            }

            return null;
        } catch (error) {
            logger.error('Error in urgency parser:', { error: error.message, stack: error.stack });
            return null;
        }
    }
};
