import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';
import { timeToMinutes, validateTime } from '../utils/timeUtils.js';

const logger = createLogger('RecurringParser');

const PATTERNS = {
    // Basic intervals
    daily: {
        pattern: /\b(?:every|each)\s+day\b/i,
        interval: 'day',
        confidence: 0.9
    },
    weekly: {
        pattern: /\b(?:every|each)\s+week\b/i,
        interval: 'week',
        confidence: 0.9
    },
    monthly: {
        pattern: /\b(?:every|each)\s+month\b/i,
        interval: 'month',
        confidence: 0.9
    },
    yearly: {
        pattern: /\b(?:every|each)\s+year\b/i,
        interval: 'year',
        confidence: 0.9
    },

    // Multiple intervals
    multipleInterval: {
        pattern: /\b(?:every|each)\s+(\d+)\s+(days?|weeks?|months?|years?)\b/i,
        interval: 'multiple',
        confidence: 0.85
    },

    // Specific weekdays
    weekday: {
        pattern: /\b(?:every|each)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
        interval: 'weekday',
        confidence: 0.85
    },

    // Ordinal weekdays (first Monday, last Friday, etc.)
    ordinalWeekday: {
        pattern: /\b(?:every|each)\s+(first|second|third|fourth|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(?:of|in)\s+(?:the\s+)?(?:month|week)\b/i,
        interval: 'ordinal',
        confidence: 0.9
    },

    // Business days
    businessDays: {
        pattern: /\b(?:every|each)\s+(?:business|working|week)\s*day\b/i,
        interval: 'business',
        confidence: 0.85
    },

    // Time-based intervals
    timeInterval: {
        pattern: /\b(?:every|each)\s+(\d+)\s+(hours?|minutes?)\b/i,
        interval: 'time',
        confidence: 0.8
    }
};

// Maps weekday names to numbers (0 = Sunday)
const WEEKDAYS = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
};

// Maps ordinal words to numbers
const ORDINALS = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    last: -1
};

export default {
    name: 'recurring',
    
    parse(text) {
        if (!text || typeof text !== 'string') {
            logger.warn('Invalid input:', { text });
            return {
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            };
        }

        try {
            // Check each pattern type
            for (const [patternName, config] of Object.entries(PATTERNS)) {
                const match = text.match(config.pattern);
                
                if (validatePatternMatch(match)) {
                    const recurrence = this.buildRecurrence(patternName, match, config);
                    if (!recurrence) continue;

                    // Validate the recurrence
                    const validationResult = this.validateRecurrence(recurrence);
                    if (!validationResult.isValid) {
                        logger.debug('Invalid recurrence:', validationResult.error);
                        continue;
                    }

                    // Look for end conditions
                    const endCondition = this.findEndCondition(text);
                    if (endCondition) {
                        recurrence.end = endCondition;
                    }

                    // Calculate confidence
                    const confidence = this.calculateConfidence(
                        match[0],
                        text,
                        config.confidence,
                        recurrence
                    );

                    logger.debug('Recurring pattern found:', {
                        type: patternName,
                        recurrence,
                        confidence
                    });

                    return {
                        type: 'recurring',
                        value: recurrence,
                        metadata: {
                            pattern: patternName,
                            confidence,
                            originalMatch: match[0],
                            includesEndCondition: Boolean(endCondition)
                        }
                    };
                }
            }

            logger.debug('No recurring pattern found');
            return null;

        } catch (error) {
            logger.error('Error in recurring parser:', {
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
    },

    buildRecurrence(patternName, match, config) {
        switch (config.interval) {
            case 'day':
            case 'week':
            case 'month':
            case 'year':
                return {
                    type: config.interval,
                    interval: 1
                };

            case 'multiple': {
                const [_, count, unit] = match;
                return {
                    type: unit.toLowerCase().replace(/s$/, ''),
                    interval: parseInt(count, 10)
                };
            }

            case 'weekday': {
                const day = match[1].toLowerCase();
                return {
                    type: 'specific',
                    day: day,
                    dayIndex: WEEKDAYS[day],
                    interval: 1
                };
            }

            case 'ordinal': {
                const [_, ordinal, weekday] = match;
                return {
                    type: 'ordinal',
                    ordinal: ORDINALS[ordinal.toLowerCase()],
                    weekday: weekday.toLowerCase(),
                    weekdayIndex: WEEKDAYS[weekday.toLowerCase()]
                };
            }

            case 'business':
                return {
                    type: 'business',
                    interval: 1,
                    excludeWeekends: true
                };

            case 'time': {
                const [_, amount, unit] = match;
                return {
                    type: 'time',
                    minutes: timeToMinutes(parseInt(amount, 10), unit)
                };
            }

            default:
                return null;
        }
    },

    validateRecurrence(recurrence) {
        switch (recurrence.type) {
            case 'time':
                if (!recurrence.minutes || recurrence.minutes <= 0) {
                    return {
                        isValid: false,
                        error: 'Invalid time interval'
                    };
                }
                break;

            case 'specific':
            case 'ordinal':
                if (recurrence.dayIndex === undefined || 
                    !WEEKDAYS[recurrence.day || recurrence.weekday]) {
                    return {
                        isValid: false,
                        error: 'Invalid weekday'
                    };
                }
                break;

            default:
                if (recurrence.interval && recurrence.interval <= 0) {
                    return {
                        isValid: false,
                        error: 'Invalid interval'
                    };
                }
        }

        return { isValid: true };
    },

    findEndCondition(text) {
        // Check for count-based end
        const countMatch = text.match(/\bfor\s+(\d+)\s+times?\b/i);
        if (countMatch) {
            return {
                type: 'count',
                value: parseInt(countMatch[1], 10)
            };
        }

        // Check for date-based end
        const untilMatch = text.match(/\buntil\s+([^,\.]+)/i);
        if (untilMatch) {
            return {
                type: 'until',
                value: untilMatch[1].trim()
            };
        }

        return null;
    },

    calculateConfidence(match, fullText, baseConfidence, recurrence) {
        let confidence = baseConfidence;

        // Adjust based on pattern specificity
        if (recurrence.type === 'ordinal' || recurrence.type === 'specific') {
            confidence += 0.05; // More specific patterns
        }

        // Adjust for time precision
        if (recurrence.type === 'time' && recurrence.minutes < 60) {
            confidence += 0.05; // Minute-level precision
        }

        // Consider position in text
        const position = fullText.toLowerCase().indexOf(match.toLowerCase());
        if (position < fullText.length * 0.2) {
            confidence += 0.05; // Recurring patterns often at start
        }

        // Adjust for business context
        if (recurrence.type === 'business') {
            if (/\b(?:meeting|call|review)\b/i.test(fullText)) {
                confidence += 0.05;
            }
        }

        return Math.min(1, confidence);
    }
};
