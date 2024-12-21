import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('DurationParser');

const DURATION_PATTERNS = [
    { regex: /(\d+)\s*(?:hour|hr)s?/i, multiplier: 60 },
    { regex: /(\d+)\s*(?:minute|min)s?/i, multiplier: 1 },
    { regex: /(\d+)\s*(?:day)s?/i, multiplier: 1440 }
];

export default {
    name: 'duration',
    parse(text) {
        try {
            let totalMinutes = 0;

            for (const pattern of DURATION_PATTERNS) {
                const match = text.match(pattern.regex);
                if (match) {
                    totalMinutes += parseInt(match[1], 10) * pattern.multiplier;
                }
            }

            if (totalMinutes > 0) {
                return {
                    type: 'duration',
                    value: totalMinutes
                };
            }

            return null;
        } catch (error) {
            logger.error('Error in duration parser:', { error: error.message, stack: error.stack });
            return null;
        }
    }
};
