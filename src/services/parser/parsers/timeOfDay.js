import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('TimeOfDayParser');

export default {
    name: 'timeOfDay',
    parse(text, patterns) {
        try {
            // Check for period of day first
            const periodMatch = text.match(/\b(morning|afternoon|evening)\b/i);
            if (periodMatch) {
                const period = periodMatch[1].toLowerCase();
                switch (period) {
                    case 'morning':
                        return { timeOfDay: { period, start: 9, end: 12 } };
                    case 'afternoon':
                        return { timeOfDay: { period, start: 13, end: 17 } };
                    case 'evening':
                        return { timeOfDay: { period, start: 18, end: 22 } };
                }
            }

            // Then check for specific times
            const timeMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
            if (timeMatch) {
                let hour = parseInt(timeMatch[1]);
                const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                const period = timeMatch[3]?.toLowerCase();
                
                if (period === 'pm' && hour < 12) hour += 12;
                if (period === 'am' && hour === 12) hour = 0;

                return { timeOfDay: { hour, minutes } };
            }

            return null;
        } catch (error) {
            logger.error('Error in timeOfDay parser:', { error });
            return null;
        }
    }
};
