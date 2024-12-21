import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('LocationParser');

export default {
    name: 'location',
    parse(text) {
        try {
            const atPattern = /\bat\s+([A-Za-z][a-zA-Z0-9\s]+(?:\s+[A-Za-z][a-zA-Z0-9\s]*)*)/i;
            const inPattern = /\bin\s+([A-Za-z][a-zA-Z0-9\s]+(?:\s+[A-Za-z][a-zA-Z0-9\s]*)*)/i;
            const colonPattern = /location:\s+([A-Za-z][a-zA-Z0-9\s]+(?:\s+[A-Za-z][a-zA-Z0-9\s]*)*)/i;

            let match = atPattern.exec(text) || 
                       inPattern.exec(text) || 
                       colonPattern.exec(text);

            if (match) {
                const location = match[1].trim();
                if (location.length > 2 && !/^(the|a|an)$/i.test(location)) {
                    return {
                        type: 'location',
                        value: location
                    };
                }
            }

            return null;
        } catch (error) {
            logger.error('Error in location parser:', { error: error.message, stack: error.stack });
            return null;
        }
    }
};
