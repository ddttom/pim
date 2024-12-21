import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('DateParser');

const DATE_PATTERNS = [
    {
        regex: /\b(tomorrow)\b/i,
        handler: () => {
            const date = new Date();
            date.setDate(date.getDate() + 1);
            return date;
        }
    },
    {
        regex: /\bnext\s+(week|month)\b/i,
        handler: (match) => {
            const date = new Date();
            if (match[1].toLowerCase() === 'week') {
                date.setDate(date.getDate() + 7);
            } else {
                date.setMonth(date.getMonth() + 1);
            }
            return date;
        }
    },
    {
        regex: /\bon\s+(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{4}))?\b/,
        handler: (match) => {
            const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
            return new Date(year, parseInt(match[2]) - 1, parseInt(match[1]));
        }
    }
];

export default {
    name: 'date',
    parse(text) {
        try {
            for (const pattern of DATE_PATTERNS) {
                const match = text.match(pattern.regex);
                if (match) {
                    const date = pattern.handler(match);
                    return {
                        type: 'date',
                        value: date.toISOString()
                    };
                }
            }

            return null;
        } catch (error) {
            logger.error('Error in date parser:', { error: error.message, stack: error.stack });
            return null;
        }
    }
};
