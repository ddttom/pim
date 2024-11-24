const { createLogger } = require('../../../utils/logger');
const logger = createLogger('PriorityParser');

module.exports = {
    name: 'priority',
    parse(text, patterns) {
        try {
            // Check for explicit priority words
            if (text.toLowerCase().includes('urgent') || text.toLowerCase().includes('important')) {
                return { priority: 'high' };
            }

            const priorityMatch = text.match(/\b(high|medium|normal|low)\s+priority\b/i);
            if (priorityMatch) {
                const priority = priorityMatch[1].toLowerCase();
                return { priority: priority === 'normal' ? 'medium' : priority };
            }

            // Check for implicit priority indicators
            if (text.toLowerCase().includes('asap') || text.toLowerCase().includes('right away')) {
                return { priority: 'high' };
            }
            if (text.toLowerCase().includes('when possible') || text.toLowerCase().includes('if you can')) {
                return { priority: 'low' };
            }

            return null;
        } catch (error) {
            logger.error('Error in priority parser:', { error });
            return null;
        }
    }
}; 