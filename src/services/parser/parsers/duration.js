import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch } from '../utils/patterns.js';

const logger = createLogger('DurationParser');

const DURATION_PATTERNS = {
    explicit_duration: /\[duration:(\d+(?:h(?:\s*\d+m)?|m))\]/i,
    natural_duration: /(\d+)\s*(?:hour|hr)s?\s+(?:and\s+)?(\d+)\s*(?:minute|min)s?\b|(\d+)\s*(?:hour|hr|minute|min|day)s?\b/i,
    short_duration: /(\d+(?:\.\d+)?)\s*([hmd])\b/i,
    implicit_duration: /(?:takes|lasts|duration|for)\s+(?:about|around|approximately)?\s*(?:a\s+)?(?:while|bit|moment|some\s+time)\b/i
};

const UNIT_MULTIPLIERS = {
    h: 60,  // hours to minutes
    m: 1,   // minutes
    d: 1440 // days to minutes
};

export const name = 'duration';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    try {
        for (const [type, pattern] of Object.entries(DURATION_PATTERNS)) {
            const matches = text.match(pattern);
            if (matches) {
                const value = extractDurationValue(matches, type);
                if (value && validateDuration(value.totalMinutes)) {
                    const confidence = getConfidence(type);
                    return {
                        type: 'duration',
                        value: {
                            hours: Math.floor(value.totalMinutes / 60),
                            minutes: value.totalMinutes % 60,
                            totalMinutes: value.totalMinutes
                        },
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
        logger.error('Error in duration parser:', { error: error.message, stack: error.stack });
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}

function extractDurationValue(matches, type) {
    try {
        switch (type) {
            case 'explicit_duration': {
                const durationStr = matches[1].toLowerCase();
                if (durationStr.includes('h') && durationStr.includes('m')) {
                    const [hours, minutes] = durationStr.split('h');
                    return {
                        totalMinutes: (parseInt(hours, 10) * 60) + parseInt(minutes.replace('m', ''), 10)
                    };
                } else if (durationStr.endsWith('h')) {
                    return {
                        totalMinutes: parseInt(durationStr.replace('h', ''), 10) * 60
                    };
                } else {
                    return {
                        totalMinutes: parseInt(durationStr.replace('m', ''), 10)
                    };
                }
            }

            case 'natural_duration': {
                if (matches[1] && matches[2]) {
                    // Combined hours and minutes format
                    const hours = parseInt(matches[1], 10);
                    const minutes = parseInt(matches[2], 10);
                    return {
                        totalMinutes: (hours * 60) + minutes
                    };
                } else {
                    // Single unit format
                    const amount = parseInt(matches[3], 10);
                    const unit = matches[0].toLowerCase().includes('hour') ? 'h' :
                               matches[0].toLowerCase().includes('day') ? 'd' : 'm';
                    return {
                        totalMinutes: amount * UNIT_MULTIPLIERS[unit]
                    };
                }
            }

            case 'short_duration': {
                const amount = parseFloat(matches[1]);
                const unit = matches[2].toLowerCase();
                return {
                    totalMinutes: Math.round(amount * UNIT_MULTIPLIERS[unit])
                };
            }

            case 'implicit_duration': {
                return {
                    totalMinutes: 30 // Default to 30 minutes for implicit durations
                };
            }

            default:
                return null;
        }
    } catch (error) {
        logger.warn('Duration extraction failed:', { matches, type, error });
        return null;
    }
}

function validateDuration(minutes) {
    return minutes > 0 && minutes <= 1440; // Max 24 hours
}

function getConfidence(type) {
    switch (type) {
        case 'explicit_duration':
            return 0.95;
        case 'short_duration':
            return 0.9;
        case 'natural_duration':
            return 0.85;
        case 'implicit_duration':
            return 0.6;
        default:
            return 0.7;
    }
}
