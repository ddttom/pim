import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('RecurringParser');

const RECURRING_PATTERNS = {
    'daily': /\bevery\s+day\b/i,
    'weekly': /\bevery\s+week\b/i,
    'monthly': /\bevery\s+month\b/i,
    'weekday': /\bevery\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i
};

export default {
    name: 'recurring',
    parse(text) {
        try {
            for (const [type, pattern] of Object.entries(RECURRING_PATTERNS)) {
                const match = text.match(pattern);
                if (match) {
                    return {
                        type: 'recurring',
                        value: {
                            frequency: type,
                            day: match[1]?.toLowerCase() // Only for weekday pattern
                        }
                    };
                }
            }

            return null;
        } catch (error) {
            logger.error('Error in recurring parser:', { error: error.message, stack: error.stack });
            return null;
        }
    }
};
