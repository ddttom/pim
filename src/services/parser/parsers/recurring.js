import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('RecurringParser');

const RECURRING_PATTERNS = {
    explicit: /\[recur:(\w+)\]/i,
    daily: /\b(?:every|each)\s+(?:day|daily)\b/i,
    weekly: /\b(?:every|each)\s+(?:week|weekly)\b/i,
    monthly: /\b(?:every|each)\s+(?:month|monthly)\b/i,
    weekday: /\b(?:every|each)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    business: /\b(?:every|each)\s+(?:business|work(?:ing)?)\s+day\b/i,
    interval: /\b(?:every|each)\s+(\d+)\s+(day|week|month|hour)s?\b/i,
    endCount: /\bfor\s+(\d+)\s+times\b/i,
    endDate: /\buntil\s+([^,\n]+)\b/i
};

const WEEKDAYS = {
    monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
    friday: 5, saturday: 6, sunday: 0
};

export const name = 'recurring';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    try {
        // Check patterns in priority order
        for (const [type, pattern] of Object.entries(RECURRING_PATTERNS)) {
            if (type === 'endCount' || type === 'endDate') continue;

            const matches = text.match(pattern);
            if (matches) {
                const value = await extractRecurringValue(matches, type);
                if (value) {
                    const endCondition = await extractEndCondition(text);
                    const confidence = calculateConfidence(type, endCondition);

                    return {
                        type: 'recurring',
                        value: {
                            ...value,
                            end: endCondition
                        },
                        metadata: {
                            pattern: type,
                            confidence,
                            originalMatch: matches[0],
                            includesEndCondition: !!endCondition
                        }
                    };
                }
            }
        }

        return null;
    } catch (error) {
        logger.error('Error in recurring parser:', error);
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}

async function extractRecurringValue(matches, type) {
    switch (type) {
        case 'explicit': {
            const value = matches[1].toLowerCase();
            switch (value) {
                case 'daily': return { type: 'day', interval: 1 };
                case 'weekly': return { type: 'week', interval: 1 };
                case 'monthly': return { type: 'month', interval: 1 };
                default: return null;
            }
        }

        case 'daily':
            return { type: 'day', interval: 1 };

        case 'weekly':
            return { type: 'week', interval: 1 };

        case 'monthly':
            return { type: 'month', interval: 1 };

        case 'weekday': {
            const day = matches[1].toLowerCase();
            return {
                type: 'specific',
                day,
                dayIndex: WEEKDAYS[day],
                interval: 1
            };
        }

        case 'business':
            return {
                type: 'business',
                interval: 1,
                excludeWeekends: true
            };

        case 'interval': {
            const interval = parseInt(matches[1], 10);
            const unit = matches[2].toLowerCase();
            if (interval <= 0) {
                throw new Error('Invalid interval value');
            }
            return { type: unit, interval };
        }

        default:
            return null;
    }
}

async function extractEndCondition(text) {
    const countMatch = text.match(RECURRING_PATTERNS.endCount);
    if (countMatch) {
        const count = parseInt(countMatch[1], 10);
        return { type: 'count', value: count };
    }

    const dateMatch = text.match(RECURRING_PATTERNS.endDate);
    if (dateMatch) {
        return { type: 'until', value: dateMatch[1] };
    }

    return null;
}

function calculateConfidence(type, endCondition) {
    let confidence;

    switch (type) {
        case 'explicit':
            confidence = 0.95;
            break;
        case 'weekday':
            confidence = 0.90;
            break;
        case 'business':
            confidence = 0.85;
            break;
        case 'daily':
        case 'weekly':
        case 'monthly':
            confidence = 0.80;
            break;
        case 'interval':
            confidence = 0.75;
            break;
        default:
            confidence = 0.70;
    }

    // End condition increases confidence slightly
    if (endCondition) {
        confidence = Math.min(confidence + 0.05, 1.0);
    }

    return confidence;
}
