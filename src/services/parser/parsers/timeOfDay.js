import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('TimeOfDayParser');

const PERIODS = {
    morning: { start: 9, end: 12 },
    afternoon: { start: 12, end: 17 },
    evening: { start: 17, end: 21 }
};

export default {
    name: 'timeOfDay',
    parse(text, patterns) {
        try {
            // Check for specific times first
            const timeMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
            if (timeMatch) {
                let hour = parseInt(timeMatch[1]);
                const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
                const period = timeMatch[3]?.toLowerCase();
                
                // Convert to 24-hour format
                if (period === 'pm' && hour < 12) {
                    hour += 12;
                } else if (period === 'am' && hour === 12) {
                    hour = 0;
                }

                return {
                    timeOfDay: {
                        hour,
                        minutes
                    }
                };
            }

            // Then check for period of day
            const periodMatch = text.match(/\b(?:in\s+the\s+)?(morning|afternoon|evening)\b/i);
            if (periodMatch) {
                const period = periodMatch[1].toLowerCase();
                const times = PERIODS[period];
                if (times) {
                    return {
                        timeOfDay: {
                            period,
                            start: times.start,
                            end: times.end
                        }
                    };
                }
            }

            return null;
        } catch (error) {
            logger.error('Error in timeOfDay parser:', { error });
            return null;
        }
    }
};
