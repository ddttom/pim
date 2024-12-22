import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('ContactParser');

const COMMON_WORDS = new Set(['me', 'team', 'everyone', 'anybody', 'someone']);

const CONTACT_PATTERNS = {
    action: /\b(?:call|email|message|contact|meet)\s+([A-Z][a-z]+)(?:\s|$)/i,
    with: /\bwith\s+([A-Z][a-z]+)(?:\s|$)/i
};

export const name = 'contact';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    try {
        for (const [type, pattern] of Object.entries(CONTACT_PATTERNS)) {
            const match = text.match(pattern);
            if (match && !COMMON_WORDS.has(match[1].toLowerCase())) {
                return {
                    type: 'contact',
                    value: match[1],
                    metadata: {
                        pattern: type,
                        confidence: calculateBaseConfidence(match[0], text),
                        originalMatch: match[0]
                    }
                };
            }
        }

        return null;
    } catch (error) {
        logger.error('Error in contact parser:', { error: error.message, stack: error.stack });
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}
