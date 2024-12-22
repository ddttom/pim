import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';
import { timeToMinutes } from '../utils/timeUtils.js';

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

    // Specific weekdays
    weekday: {
        pattern: /\b(?:every|each)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
        interval: 'weekday',
        confidence: 0.9
    },

    // Multiple occurrences
    multiple: {
        pattern: /\b(?:every|each)\s+(\d+)\s+(days?|weeks?|months?|years?)\b/i,
        interval: 'multiple',
        confidence: 0.85
    },

    // Time-based recurrence
    timeInterval: {
        pattern: /\b(?:every|each)\s+(\d+)\s+(hours?|minutes?)\b/i,
        interval: 'time',
        confidence: 0.85
    },

    // Ordinal occurrences
    ordinal: {
        pattern: /\b(?:every|each)\s+(first|second|third|fourth|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(?:of|in)\s+(?:the\s+)?(?:month|week)\b/i,
        interval: 'ordinal',
        confidence: 0.8
    },

    // Business days
    businessDays: {
        pattern: /\b(?:every|each)\s+(?:business|working|week)\s*day\b/i,
        interval: 'business',
        confidence: 0.85
    }
};

// Map weekday names to numbers (0 = Sunday)
const WEEKDAYS = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
};

// Map ordinal words to numbers
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
            for (const [patternType, config] of Object.entries(PATTERNS)) {
                const match = text.match(config.pattern);
                
                if (validatePatternMatch(match)) {
                    const recurrence = this.buildRecurrence(patternType, match, config);
                    if (!recurrence) continue;

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
                        type: patternType,
                        recurrence,
                        confidence
                    });

                    return {
                        type: 'recurring',
                        value: recurrence,
                        metadata: {
                            pattern: patternType,
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

    buildRecurrence(type, match, config) {
        switch (config.interval) {
            case 'day':
            case 'week':
            case 'month':
            case 'year':
                return {
                    type: config.interval,
                    interval: 1
                };

            case 'weekday':
                const day = match[1].toLowerCase();
                return {
                    type: 'specific',
                    day: day,
                    dayIndex: WEEKDAYS[day],
                    interval: 1
                };

            case 'multiple':
                const [_, count, unit] = match;
                return {
                    type: unit.toLowerCase().replace(/s$/, ''),
                    interval: parseInt(count, 10)
                };

            case 'time':
                const [__, amount, unit] = match;
                return {
                    type: 'time',
                    minutes: timeToMinutes(parseInt(amount, 10), unit)
                };

            case 'ordinal':
                const [___, ordinal, weekday] = match;
                return {
                    type: 'ordinal',
                    ordinal: ORDINALS[ordinal.toLowerCase()],
                    weekday: weekday.toLowerCase(),
                    weekdayIndex: WEEKDAYS[weekday.toLowerCase()]
                };

            case 'business':
                return {
                    type: 'business',
                    interval: 1,
                    excludeWeekends: true
                };

            default:
                logger.warn('Unknown interval type:', type);
                return null;
        }
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
            // Note: This would ideally use the date parser to parse the end date
            return {
                type: 'until',
                value: untilMatch[1].trim()
            };
        }

        return null;
    },

    calculateConfidence(match, fullText, baseConfidence, recurrence) {
        let confidence = baseConfidence;

        // Adjust based on presence of end condition
        if (this.findEndCondition(fullText)) {
            confidence += 0.1;
        }

        // Adjust based on interval specificity
        if (recurrence.type === 'specific' || recurrence.type === 'ordinal') {
            confidence += 0.05;
        }

        // Adjust based on time precision
        if (recurrence.type === 'time' && recurrence.minutes < 60) {
            confidence += 0.05;
        }

        // Consider position in text
        const position = fullText.toLowerCase().indexOf(match.toLowerCase());
        const isNearStart = position < fullText.length * 0.2;
        if (isNearStart) confidence += 0.05;

        return Math.min(1, confidence);
    }
};
