import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('AttendeesParser');

const ATTENDEE_PATTERNS = {
    standard: /\battendees?:\s*([^:\n]+)(?:\n|$)/i,
    participants: /\bparticipants?:\s*([^:\n]+)(?:\n|$)/i,
    present: /\bpresent:\s*([^:\n]+)(?:\n|$)/i
};

export const name = 'attendees';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    const results = [];

    for (const [type, pattern] of Object.entries(ATTENDEE_PATTERNS)) {
        const matches = text.match(pattern);
        if (matches) {
            const value = await extractValue(matches);
            const confidence = calculateConfidence(matches, text);

            results.push({
                type: 'attendees',
                value,
                confidence,
                metadata: {
                    pattern: pattern.source,
                    originalMatch: matches[0],
                    attendeeCount: value.length
                }
            });
        }
    }

    return results;
}

function extractValue(matches) {
    return matches[1]
        .split(/[,;]/)
        .map(name => name.trim())
        .filter(name => name.length > 0);
}

function calculateConfidence(matches, fullText) {
    let confidence = 0.7;

    // Increase confidence based on format and context
    if (matches[0].toLowerCase().startsWith('attendees:')) confidence += 0.2;
    if (matches.index === 0 || fullText[matches.index - 1] === '\n') confidence += 0.1;

    return Math.min(confidence, 1.0);
}
