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

    const patterns = {
        explicit_mentions: /@(\w+)(?:\s*,\s*@(\w+))*(?:\s*(?:and|&)\s*@(\w+))?/i,
        role_mentions: /@(\w+)\s*\(([^)]+)\)(?:\s*(?:and|&)\s*@(\w+)\s*\(([^)]+)\))?/i,
        single_mention: /@(\w+)\b/i
    };

    let bestMatch = null;
    let highestConfidence = 0;

    for (const [pattern, regex] of Object.entries(patterns)) {
        const match = text.match(regex);
        if (match) {
            let confidence;
            let value;

            switch (pattern) {
                case 'explicit_mentions': {
                    confidence = 0.9;
                    const attendees = match.slice(1).filter(Boolean);
                    value = {
                        attendees,
                        count: attendees.length
                    };
                    break;
                }

                case 'role_mentions': {
                    confidence = 0.95;
                    const attendees = [];
                    for (let i = 1; i < match.length; i += 2) {
                        if (match[i]) {
                            attendees.push({
                                name: match[i],
                                role: match[i + 1]
                            });
                        }
                    }
                    value = {
                        attendees,
                        count: attendees.length
                    };
                    break;
                }

                case 'single_mention': {
                    confidence = 0.85;
                    value = {
                        attendees: [match[1]],
                        count: 1
                    };
                    break;
                }
            }

            if (confidence > highestConfidence) {
                highestConfidence = confidence;
                bestMatch = {
                    type: 'attendees',
                    value,
                    metadata: {
                        confidence,
                        pattern,
                        originalMatch: match[0]
                    }
                };
            }
        }
    }

    return bestMatch;
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
