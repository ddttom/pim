import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('ParticipantsParser');

const PARTICIPANT_PATTERNS = {
    mention: /@(\w+)/g,
    with: /\bwith\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    and: /\band\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
};

export const name = 'participants';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    try {
        const participants = new Set();
        const matches = [];

        for (const [type, pattern] of Object.entries(PARTICIPANT_PATTERNS)) {
            const patternMatches = Array.from(text.matchAll(pattern));
            for (const match of patternMatches) {
                participants.add(match[1]);
                matches.push(match[0]);
            }
        }

        if (participants.size > 0) {
            return {
                type: 'participants',
                value: Array.from(participants),
                metadata: {
                    confidence: calculateBaseConfidence(matches.join(' '), text),
                    originalMatches: matches,
                    count: participants.size
                }
            };
        }

        return null;
    } catch (error) {
        logger.error('Error in participants parser:', { error: error.message, stack: error.stack });
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}
