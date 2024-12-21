import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('CategoriesParser');

export default {
    name: 'categories',
    parse(text) {
        try {
            const hashtagPattern = /#([a-zA-Z]\w+)/g;
            const matches = [...text.matchAll(hashtagPattern)].map(match => match[1].toLowerCase());

            if (matches.length > 0) {
                return {
                    type: 'categories',
                    value: matches
                };
            }

            return null;
        } catch (error) {
            logger.error('Error in categories parser:', { error: error.message, stack: error.stack });
            return null;
        }
    }
};
