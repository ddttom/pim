const { createLogger } = require('../../../utils/logger');
const logger = createLogger('RecurringParser');

module.exports = {
    name: 'recurring',
    parse(text, patterns) {
        try {
            const recurringMatch = text.match(/\b(?:every|each)\s+(day|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
            if (recurringMatch) {
                const interval = recurringMatch[1].toLowerCase();
                if (interval === 'day') {
                    return { recurring: { type: 'daily' } };
                }
                if (interval === 'month') {
                    return { recurring: { type: 'monthly' } };
                }
                if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(interval)) {
                    return { recurring: { type: 'weekly', interval } };
                }
            }
            return null;
        } catch (error) {
            logger.error('Error in recurring parser:', { error });
            return null;
        }
    }
}; 