import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('TimeParser');

const TIME_PATTERNS = {
    specific: /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
    period: /\b(morning|afternoon|evening)\b/i,
    action: /\b(meet|call|text)\b/i
};

const TIME_OF_DAY = {
    morning: { start: 9, end: 12 },
    afternoon: { start: 12, end: 17 },
    evening: { start: 17, end: 21 }
};

export const name = 'time';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    try {
        // Check for period words first
        const periodMatch = text.match(TIME_PATTERNS.period);
        if (periodMatch) {
            const period = periodMatch[1].toLowerCase();
            const config = TIME_OF_DAY[period];
            if (config) {
                return {
                    type: 'time',
                    value: {
                        period,
                        start: config.start,
                        end: config.end
                    },
                    metadata: {
                        pattern: 'period',
                        confidence: calculateConfidence(periodMatch, text, 'period'),
                        originalMatch: periodMatch[0]
                    }
                };
            }
        }

        // Parse specific time
        const timeMatch = text.match(TIME_PATTERNS.specific);
        if (timeMatch) {
            const [_, hours, minutes, meridian] = timeMatch;
            const { parsedHours, parsedMinutes } = parseTimeComponents(hours, minutes, meridian);

            return {
                type: 'time',
                value: {
                    hours: parsedHours,
                    minutes: parsedMinutes
                },
                metadata: {
                    pattern: 'specific',
                    confidence: calculateConfidence(timeMatch, text, 'specific'),
                    originalMatch: timeMatch[0]
                }
            };
        }

        return null;
    } catch (error) {
        logger.error('Error in time parser:', error);
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}

function parseTimeComponents(hours, minutes, meridian) {
    let parsedHours = parseInt(hours, 10);
    const parsedMinutes = parseInt(minutes || '0', 10);

    if (meridian?.toLowerCase() === 'pm' && parsedHours < 12) {
        parsedHours += 12;
    } else if (meridian?.toLowerCase() === 'am' && parsedHours === 12) {
        parsedHours = 0;
    }

    if (parsedHours < 0 || parsedHours > 23 || parsedMinutes < 0 || parsedMinutes > 59) {
        throw new Error('Invalid time values');
    }

    return { parsedHours, parsedMinutes };
}

function calculateConfidence(matches, text, type) {
    let confidence = 0.7;

    // Pattern-based confidence
    switch (type) {
        case 'specific': confidence += 0.2; break;
        case 'period': confidence += 0.15; break;
        case 'action': confidence += 0.1; break;
    }

    // Position-based confidence
    if (matches.index === 0) confidence += 0.1;
    if (text[matches.index - 1] === ' ') confidence += 0.05;

    return Math.min(confidence, 1.0);
} 
