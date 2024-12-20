import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('CategoriesParser');

export default {
    name: 'categories',
    parse(text, patterns) {
        try {
            const categories = new Set();
            
            // Add 'calls' category for text messages
            if (text.toLowerCase().match(/\b(text|call)\b/)) {
                categories.add('calls');
            }

            // Add categories from hashtags
            const hashtagMatches = Array.from(text.matchAll(/#(\w+)/g));
            hashtagMatches.forEach(match => categories.add(match[1]));

            return categories.size > 0 ? { categories: Array.from(categories) } : null;
        } catch (error) {
            logger.error('Error in categories parser:', { error });
            return null;
        }
    }
};
