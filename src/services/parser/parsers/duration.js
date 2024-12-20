import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('DurationParser');

export default {
    name: 'duration',
    parse(text, patterns) {
        try {
            const durationMatch = text.match(/(?:for|lasting)\s+(\d+)\s+(minutes?|mins?|hours?|hrs?)\b/i);
            if (durationMatch) {
                const amount = parseInt(durationMatch[1]);
                const unit = durationMatch[2].toLowerCase();
                
                if (unit.startsWith('hour')) {
                    return { duration: { hours: amount } };
                }
                return { duration: { minutes: amount } };
            }
            return null;
        } catch (error) {
            logger.error('Error in duration parser:', { error });
            return null;
        }
    }
};
