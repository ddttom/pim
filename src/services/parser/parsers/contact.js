const { createLogger } = require('../../../utils/logger');
const logger = createLogger('ContactParser');

module.exports = {
    name: 'contact',
    parse(text, patterns) {
        try {
            const contactPattern = /(?:with|to|for|@|text)\s+([A-Z][a-z]+)(?=\s|,|$|\s+(?:and|about|tomorrow|next|at))/i;
            const contactMatch = text.match(contactPattern);
            if (contactMatch) {
                return { contact: contactMatch[1] };
            }
            return null;
        } catch (error) {
            logger.error('Error in contact parser:', { error });
            return null;
        }
    }
}; 