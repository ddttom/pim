import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ContactParser');

const COMMON_WORDS = new Set(['me', 'team', 'everyone', 'anybody', 'someone']);

export default {
    name: 'contact',
    parse(text) {
        try {
            const actionPattern = /\b(?:call|email|message|contact|meet)\s+([A-Z][a-z]+)(?:\s|$)/;
            const withPattern = /\bwith\s+([A-Z][a-z]+)(?:\s|$)/;
            
            let match = actionPattern.exec(text) || withPattern.exec(text);

            if (match && !COMMON_WORDS.has(match[1].toLowerCase())) {
                return {
                    type: 'contact',
                    value: match[1]
                };
            }

            return null;
        } catch (error) {
            logger.error('Error in contact parser:', { error: error.message, stack: error.stack });
            return null;
        }
    }
};
