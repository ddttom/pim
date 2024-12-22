import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('RemindersParser');

const REMINDER_PATTERNS = {
    explicit: /\bremind(?:er)?\s*(?:me|us)?\s*(?:in|after)\s*(\d+)\s*(minute|hour|day|week)s?\b/i,
    before: /\b(\d+)\s*(minute|hour|day|week)s?\s*before\b/i,
    at: /\bremind(?:er)?\s*(?:me|us)?\s*at\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
    on: /\bremind(?:er)?\s*(?:me|us)?\s*on\s*([^,\n]+)\b/i,
    relative: /\b(?:in|after)\s*(\d+)\s*(minute|hour|day|week)s?\b/i
};

const TIME_UNITS = {
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000
};

export const name = 'reminders';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    try {
        for (const [type, pattern] of Object.entries(REMINDER_PATTERNS)) {
            const matches = text.match(pattern);
            if (matches) {
                const value = await extractReminderValue(matches, type);
                if (value) {
                    const confidence = calculateConfidence(matches, text, type);
                    return {
                        type: 'reminder',
                        value,
                        metadata: {
                            pattern: type,
                            confidence,
                            originalMatch: matches[0],
                            isRelative: type === 'relative' || type === 'explicit'
                        }
                    };
                }
            }
        }

        return null;
    } catch (error) {
        logger.error('Error in reminders parser:', error);
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}

async function extractReminderValue(matches, type) {
    try {
        switch (type) {
            case 'explicit':
            case 'relative': {
                const amount = parseInt(matches[1], 10);
                const unit = matches[2].toLowerCase();
                if (amount <= 0) throw new Error('Invalid time amount');
                return {
                    type: 'offset',
                    minutes: (amount * TIME_UNITS[unit]) / (60 * 1000)
                };
            }

            case 'before': {
                const amount = parseInt(matches[1], 10);
                const unit = matches[2].toLowerCase();
                if (amount <= 0) throw new Error('Invalid time amount');
                return {
                    type: 'before',
                    minutes: (amount * TIME_UNITS[unit]) / (60 * 1000)
                };
            }

            case 'at': {
                const hours = parseInt(matches[1], 10);
                const minutes = parseInt(matches[2] || '0', 10);
                const meridian = matches[3]?.toLowerCase();
                
                let hour = hours;
                if (meridian === 'pm' && hour < 12) hour += 12;
                if (meridian === 'am' && hour === 12) hour = 0;

                if (hour < 0 || hour > 23 || minutes < 0 || minutes > 59) {
                    throw new Error('Invalid time values');
                }

                return {
                    type: 'time',
                    hour,
                    minutes
                };
            }

            case 'on': {
                return {
                    type: 'date',
                    value: matches[1].trim()
                };
            }

            default:
                return null;
        }
    } catch (error) {
        logger.warn('Reminder extraction failed:', { matches, type, error });
        return null;
    }
}

function calculateConfidence(matches, text, type) {
    let confidence = 0.7;

    // Pattern-based confidence
    switch (type) {
        case 'explicit': confidence += 0.2; break;
        case 'at': confidence += 0.15; break;
        case 'before': confidence += 0.15; break;
        case 'on': confidence += 0.1; break;
        case 'relative': confidence += 0.05; break;
    }

    // Position-based confidence
    if (matches.index === 0) confidence += 0.1;
    if (text[matches.index - 1] === ' ') confidence += 0.05;

    return Math.min(confidence, 1.0);
}
