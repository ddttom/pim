import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('ParticipantsParser');

export const name = 'participants';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    const patterns = {
        explicit_list: /\[participants:([^\]]+)\]/i,
        role_assignment: /\b(\w+)\s*\(([^)]+)\)(?:\s*(?:and|&)\s*(\w+)\s*\(([^)]+)\))?/i,
        mentions: /@(\w+)(?:\s*(?:and|&)\s*@(\w+))?/i
    };

    let bestMatch = null;
    let highestConfidence = 0;

    for (const [pattern, regex] of Object.entries(patterns)) {
        const match = text.match(regex);
        if (match) {
            let confidence;
            let value;

            switch (pattern) {
                case 'explicit_list': {
                    confidence = 0.95;
                    const participants = match[1]
                        .split(/,\s*/)
                        .map(p => p.trim())
                        .filter(Boolean);
                    value = {
                        participants,
                        count: participants.length
                    };
                    break;
                }

                case 'role_assignment': {
                    confidence = 0.90;
                    const participants = [];
                    if (match[1]) {
                        participants.push({
                            name: match[1],
                            role: match[2]
                        });
                    }
                    if (match[3]) {
                        participants.push({
                            name: match[3],
                            role: match[4]
                        });
                    }
                    value = {
                        participants,
                        count: participants.length
                    };
                    break;
                }

                case 'mentions': {
                    confidence = 0.90;
                    const participants = [match[1], match[2]]
                        .filter(Boolean)
                        .map(p => p.toLowerCase());
                    value = {
                        participants,
                        count: participants.length
                    };
                    break;
                }
            }

            if (confidence > highestConfidence) {
                highestConfidence = confidence;
                bestMatch = {
                    type: 'participants',
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
