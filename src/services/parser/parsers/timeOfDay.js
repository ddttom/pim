import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('TimeOfDayParser');

const TIME_PATTERNS = {
    explicit: /\[time:(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\]/i,
    standard: /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
    period: /\b(?:in\s+the\s+)?(morning|afternoon|evening)\b/i
};

const PERIODS = {
    morning: { start: 9, end: 12 },
    afternoon: { start: 12, end: 17 },
    evening: { start: 17, end: 21 }
};

export const name = 'timeOfDay';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    try {
        // Check each pattern type
        for (const [type, pattern] of Object.entries(TIME_PATTERNS)) {
            const matches = text.match(pattern);
            if (matches) {
                const value = await extractTimeValue(matches, type);
                if (value) {
                    const baseConfidence = calculateBaseConfidence(matches, text);
                    const confidence = adjustConfidence(baseConfidence, type);
                    return {
                        type: 'timeofday',
                        value,
                        metadata: {
                            pattern: type,
                            confidence,
                            originalMatch: matches[0]
                        }
                    };
                }
            }
        }

        return null;
    } catch (error) {
        logger.error('Error in timeOfDay parser:', error);
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}

async function extractTimeValue(matches, type) {
    try {
        if (type === 'explicit' || type === 'standard') {
            let hour = parseInt(matches[1], 10);
            const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
            const period = matches[3]?.toLowerCase();

            // Validate values
            if (hour < 0 || hour > 23 || minutes < 0 || minutes > 59) {
                return null;
            }

            // Convert to 24-hour format
            if (period === 'pm' && hour < 12) {
                hour += 12;
            } else if (period === 'am' && hour === 12) {
                hour = 0;
            }

            return {
                hour,
                minutes,
                format: '24hour'
            };
        }

        if (type === 'period') {
            const period = matches[1].toLowerCase();
            const times = PERIODS[period];
            if (times) {
                return {
                    period,
                    start: times.start,
                    end: times.end,
                    format: 'period'
                };
            }
        }

        return null;
    } catch (error) {
        logger.warn('Time extraction failed:', { matches, type, error });
        return null;
    }
}

function adjustConfidence(baseConfidence, type) {
    let confidence = baseConfidence;

    // Adjust confidence based on pattern type
    switch (type) {
        case 'explicit':
            confidence += 0.2;
            break;
        case 'standard':
            confidence += 0.15;
            break;
        case 'period':
            confidence += 0.1;
            break;
    }

    return Math.min(confidence, 1.0);
}
