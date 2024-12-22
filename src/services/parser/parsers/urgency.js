import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('UrgencyParser');

const URGENCY_PATTERNS = {
    explicit: {
        pattern: /\b(asap|urgent|immediately)\b/i,
        value: 'high',
        confidence: 0.9
    },
    moderate: {
        pattern: /\b(soon|shortly)\b/i,
        value: 'medium',
        confidence: 0.8
    },
    low: {
        pattern: /\b(whenever|eventually)\b/i,
        value: 'low',
        confidence: 0.7
    }
};

export const name = 'urgency';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    try {
        for (const [type, config] of Object.entries(URGENCY_PATTERNS)) {
            const match = text.match(config.pattern);
            if (match) {
                return {
                    type: 'urgency',
                    value: config.value,
                    metadata: {
                        pattern: type,
                        confidence: config.confidence,
                        originalMatch: match[0]
                    }
                };
            }
        }

        return null;
    } catch (error) {
        logger.error('Error in urgency parser:', { error: error.message, stack: error.stack });
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}
