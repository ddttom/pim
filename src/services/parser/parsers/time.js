import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('TimeParser');

const TIME_PATTERNS = {
    specific: /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
    period: /\b(?:in\s+the\s+)?(morning|afternoon|evening)\b/i,
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
            const timeValue = parseTimeComponents(timeMatch[1], timeMatch[2], timeMatch[3]);
            if (!timeValue) {
                return {
                    type: 'error',
                    error: 'PARSER_ERROR',
                    message: 'Invalid time values'
                };
            }

            return {
                type: 'time',
                value: timeValue,
                metadata: {
                    pattern: 'specific',
                    confidence: calculateConfidence(timeMatch, text, 'specific'),
                    originalMatch: timeMatch[0]
                }
            };
        }

        return null;
    } catch (error) {
        logger.error('Error in time parser:', {
            error: error.message,
            stack: error.stack,
            input: text
        });
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}

function parseTimeComponents(hours, minutes, meridian) {
    try {
        let parsedHours = parseInt(hours, 10);
        const parsedMinutes = parseInt(minutes || '0', 10);

        // Basic validation
        if (isNaN(parsedHours) || isNaN(parsedMinutes)) {
            return null;
        }

        // Handle 12-hour format
        if (meridian) {
            if (parsedHours < 1 || parsedHours > 12) {
                return null;
            }
            if (meridian.toLowerCase() === 'pm' && parsedHours < 12) {
                parsedHours += 12;
            } else if (meridian.toLowerCase() === 'am' && parsedHours === 12) {
                parsedHours = 0;
            }
        }

        // 24-hour format validation
        if (parsedHours < 0 || parsedHours > 23) {
            return null;
        }

        // Minutes validation
        if (parsedMinutes < 0 || parsedMinutes > 59) {
            return null;
        }

        return {
            hours: parsedHours,
            minutes: parsedMinutes
        };
    } catch (error) {
        logger.warn('Time parsing failed:', { hours, minutes, meridian, error });
        return null;
    }
}

function calculateConfidence(matches, text, type) {
    let confidence = 0.7;

    // Pattern-based confidence
    switch (type) {
        case 'specific':
            confidence = matches[2] ? 0.95 : 0.9; // Higher confidence with minutes specified
            if (matches[3]) confidence += 0.02; // Additional boost for AM/PM
            break;
        case 'period':
            confidence = matches[0].includes('in the') ? 0.85 : 0.8;
            break;
        case 'action':
            confidence = 0.75;
            break;
    }

    // Position-based confidence
    if (matches.index === 0) {
        confidence = Math.min(confidence + 0.05, 1.0);
    }

    return confidence;
}
