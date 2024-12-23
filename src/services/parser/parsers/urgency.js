import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('UrgencyParser');

export const name = 'urgency';

const URGENCY_LEVELS = {
    high: 3,
    medium: 2,
    low: 1
};

const URGENCY_KEYWORDS = {
    urgent: 'high',
    asap: 'high',
    critical: 'high',
    important: 'high',
    priority: 'high',
    moderate: 'medium',
    normal: 'medium',
    standard: 'medium',
    low: 'low',
    minor: 'low',
    routine: 'low'
};

const TIME_URGENCY = new Set([
    'asap',
    'immediately',
    'right away',
    'right now',
    'as soon as possible'
]);

function validateUrgencyLevel(level) {
    return level && typeof level === 'string' && level.toLowerCase() in URGENCY_LEVELS;
}

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    try {
        // Check for explicit urgency format
        const explicitMatch = text.match(/\[urgency:([^\]]+)\]/i);
        if (explicitMatch) {
            const level = explicitMatch[1].toLowerCase().trim();
            if (!validateUrgencyLevel(level)) return null;

            return {
                type: 'urgency',
                value: {
                    level,
                    score: URGENCY_LEVELS[level]
                },
                metadata: {
                    pattern: 'explicit_urgency',
                    confidence: 0.95,
                    originalMatch: explicitMatch[0]
                }
            };
        }

        // Check for urgency keywords
        const lowerText = text.toLowerCase();
        for (const [keyword, level] of Object.entries(URGENCY_KEYWORDS)) {
            const keywordMatch = text.match(new RegExp(`\\b${keyword}\\b`, 'i'));
            if (keywordMatch) {
                const isTimeBased = TIME_URGENCY.has(keyword);
                return {
                    type: 'urgency',
                    value: {
                        level,
                        score: URGENCY_LEVELS[level],
                        ...(isTimeBased ? { timeBased: true } : { keyword })
                    },
                    metadata: {
                        pattern: isTimeBased ? 'time_urgency' : 'keyword_urgency',
                        confidence: isTimeBased ? 0.85 : 0.80,
                        originalMatch: keywordMatch[0]
                    }
                };
            }
        }

        return null;
    } catch (error) {
        logger.error('Error in urgency parser:', error);
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}
