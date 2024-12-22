import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('LinksParser');

const LINK_PATTERNS = {
    url: /(https?:\/\/[^\s]+)/g,
    file: /(file:\/\/[^\s]+)/g
};

export const name = 'links';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    try {
        const results = [];
        
        for (const [type, pattern] of Object.entries(LINK_PATTERNS)) {
            const matches = Array.from(text.matchAll(pattern));
            for (const match of matches) {
                results.push(match[1]);
            }
        }

        if (results.length > 0) {
            return {
                type: 'links',
                value: results,
                metadata: {
                    confidence: 0.9, // URLs are highly reliable matches
                    count: results.length,
                    types: {
                        web: results.filter(url => url.startsWith('http')).length,
                        file: results.filter(url => url.startsWith('file')).length
                    }
                }
            };
        }

        return null;
    } catch (error) {
        logger.error('Error in links parser:', { error: error.message, stack: error.stack });
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}
