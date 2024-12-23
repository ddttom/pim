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

    const patterns = {
        explicit_urgency: /\[urgency:(high|medium|low)\]/i,
        keyword_urgency: /\b(urgent|asap|emergency|critical|important|priority)\b/i,
        time_urgency: /\b(due|deadline|by|before|until)\b/i
    };

    const urgencyLevels = {
        high: 3,
        medium: 2,
        low: 1
    };

    let bestMatch = null;
    let highestConfidence = 0;

    for (const [pattern, regex] of Object.entries(patterns)) {
        const match = text.match(regex);
        if (match) {
            let confidence;
            let value;

            switch (pattern) {
                case 'explicit_urgency':
                    confidence = 0.95;
                    value = {
                        level: match[1].toLowerCase(),
                        score: urgencyLevels[match[1].toLowerCase()]
                    };
                    break;
                case 'keyword_urgency':
                    confidence = 0.9;
                    value = {
                        level: 'high',
                        score: 3,
                        keyword: match[1].toLowerCase()
                    };
                    break;
                case 'time_urgency':
                    confidence = 0.85;
                    value = {
                        level: 'high',
                        score: 3,
                        timeBased: true
                    };
                    break;
            }

            if (confidence > highestConfidence) {
                highestConfidence = confidence;
                bestMatch = {
                    type: 'urgency',
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
