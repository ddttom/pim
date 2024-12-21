import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('SubjectParser');

const IGNORE_PATTERNS = [
    /\b(?:at|in|on|with|for|to|from)\s+/i,
    /\b(?:every|each)\s+/i,
    /\b(?:high|medium|low)\s+priority\b/i,
    /\b(?:urgent|asap)\b/i,
    /#\w+/,
    /@\w+/
];

export default {
    name: 'subject',
    parse(text) {
        try {
            // Remove other patterns we don't want in the subject
            let cleanText = text;
            IGNORE_PATTERNS.forEach(pattern => {
                cleanText = cleanText.replace(pattern, ' ');
            });

            // Clean up whitespace and get first meaningful segment
            const subject = cleanText.split(/[,.]/)
                                   .map(s => s.trim())
                                   .filter(s => s.length > 3)[0];

            if (subject) {
                return {
                    type: 'subject',
                    value: subject
                };
            }

            return null;
        } catch (error) {
            logger.error('Error in subject parser:', { error: error.message, stack: error.stack });
            return null;
        }
    }
};
