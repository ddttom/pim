const { createLogger } = require('../../../utils/logger');
const logger = createLogger('StatusParser');

module.exports = {
    name: 'status',
    parse(text, patterns) {
        try {
            const statusMatch = text.match(/(\d+)%\s+complete/i);
            if (statusMatch) {
                return {
                    status: {
                        progress: parseInt(statusMatch[1])
                    }
                };
            }
            return null;
        } catch (error) {
            logger.error('Error in status parser:', { error });
            return null;
        }
    }
}; 