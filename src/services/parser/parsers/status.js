import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('StatusParser');

const STATUS_KEYWORDS = {
    'started': 'Started',
    'in progress': 'InProgress',
    'done': 'Done',
    'completed': 'Completed',
    'pending': 'Pending',
    'blocked': 'Blocked'
};

export default {
    name: 'status',
    parse(text) {
        try {
            const statusPattern = new RegExp(`\\b(${Object.keys(STATUS_KEYWORDS).join('|')})\\b`, 'i');
            const match = text.match(statusPattern);

            if (match) {
                return {
                    type: 'status',
                    value: STATUS_KEYWORDS[match[1].toLowerCase()]
                };
            }

            return null;
        } catch (error) {
            logger.error('Error in status parser:', { error: error.message, stack: error.stack });
            return null;
        }
    }
};
