import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('DurationParser');

const DURATION_PATTERNS = {
    hour: { regex: /(\d+)\s*(?:hour|hr)s?/i, multiplier: 60 },
    minute: { regex: /(\d+)\s*(?:minute|min)s?/i, multiplier: 1 },
    day: { regex: /(\d+)\s*(?:day)s?/i, multiplier: 1440 }
};

export const name = 'duration';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    try {
        let totalMinutes = 0;
        const matches = [];

        for (const [type, config] of Object.entries(DURATION_PATTERNS)) {
            const match = text.match(config.regex);
            if (match) {
                const minutes = parseInt(match[1], 10) * config.multiplier;
                totalMinutes += minutes;
                matches.push(match[0]);
            }
        }

        if (totalMinutes > 0) {
            return {
                type: 'duration',
                value: totalMinutes,
                metadata: {
                    confidence: calculateBaseConfidence(matches.join(' '), text),
                    originalMatches: matches
                }
            };
        }

        return null;
    } catch (error) {
        logger.error('Error in duration parser:', { error: error.message, stack: error.stack });
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}
