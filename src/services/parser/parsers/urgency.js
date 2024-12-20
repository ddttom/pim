import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('UrgencyParser');

export default {
    name: 'urgency',
    parse(text, patterns) {
        try {
            const urgencyMatch = text.match(/\b(asap|urgent|end of day|soon)\b/i);
            if (urgencyMatch) {
                const level = urgencyMatch[1].toLowerCase();
                switch (level) {
                    case 'asap':
                    case 'urgent':
                        return { urgency: { level: 'immediate' } };
                    case 'end of day':
                        return { urgency: { level: 'today' } };
                    case 'soon':
                        return { urgency: { level: 'soon' } };
                }
            }
            return null;
        } catch (error) {
            logger.error('Error in urgency parser:', { error });
            return null;
        }
    }
};
