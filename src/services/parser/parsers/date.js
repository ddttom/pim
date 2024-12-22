import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';
import { validateTime } from '../utils/timeUtils.js';

const logger = createLogger('DateParser');

const PATTERNS = {
    // Absolute dates
    iso: {
        pattern: /\b(\d{4})-(\d{2})-(\d{2})\b/,
        confidence: 0.95,
        type: 'absolute'
    },
    short: {
        pattern: /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?\b/,
        confidence: 0.85,
        type: 'absolute'
    },
    
    // Relative dates
    today: {
        pattern: /\b(?:today|now)\b/i,
        confidence: 0.9,
        type: 'relative'
    },
    tomorrow: {
        pattern: /\btomorrow\b/i,
        confidence: 0.9,
        type: 'relative'
    },
    nextWeek: {
        pattern: /\bnext\s+week\b/i,
        confidence: 0.85,
        type: 'relative'
    },
    nextMonth: {
        pattern: /\bnext\s+month\b/i,
        confidence: 0.85,
        type: 'relative'
    },
    
    // Day references
    weekday: {
        pattern: /\b(?:this|next|last)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
        confidence: 0.8,
        type: 'weekday'
    },
    weekend: {
        pattern: /\b(?:this|next|last)?\s*weekend\b/i,
        confidence: 0.8,
        type: 'weekday'
    },
    
    // Time references
    timeOfDay: {
        pattern: /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
        confidence: 0.9,
        type: 'time'
    },
    periodOfDay: {
        pattern: /\b(morning|afternoon|evening|night)\b/i,
        confidence: 0.8,
        type: 'period'
    },
    
    // Duration-based
    inDuration: {
        pattern: /\bin\s+(\d+)\s+(day|week|month|year)s?\b/i,
        confidence: 0.85,
        type: 'duration'
    },
    afterDuration: {
        pattern: /\bafter\s+(\d+)\s+(day|week|month|year)s?\b/i,
        confidence: 0.85,
        type: 'duration'
    }
};

// Default times for periods of day
const DEFAULT_TIMES = {
    morning: { hour: 9, minute: 0 },
    afternoon: { hour: 14, minute: 0 },
    evening: { hour: 18, minute: 0 },
    night: { hour: 20, minute: 0 }
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

export default {
    name: 'date',
    
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
            const now = new Date();
            let result = null;
            let patternType = '';
            let confidence = 0;
            let metadata = {};

            // Check each pattern type
            for (const [patternName, config] of Object.entries(PATTERNS)) {
                const match = text.match(config.pattern);
                
                if (validatePatternMatch(match)) {
                    const dateResult = this.processPattern(patternName, match, config, now);
                    if (!dateResult) continue;

                    // Calculate pattern-specific confidence
                    const patternConfidence = this.calculateConfidence(
                        match[0],
                        text,
                        config.confidence,
                        dateResult.date
                    );

                    // Update result if confidence is higher or current result is null
                    if (!result || patternConfidence > confidence) {
                        result = dateResult.date;
                        confidence = patternConfidence;
                        patternType = patternName;
                        metadata = dateResult.metadata || {};
                    }
                }
            }

            if (!result) {
                logger.debug('No date pattern found');
                return null;
            }

            // Check for additional time specification
            const timeMatch = text.match(PATTERNS.timeOfDay.pattern);
            const periodMatch = text.match(PATTERNS.periodOfDay.pattern);
            
            if (timeMatch && !metadata.hasTime) {
                this.applyTime(result, timeMatch);
                metadata.hasTime = true;
                confidence += 0.1;
            } else if (periodMatch && !metadata.hasTime) {
                this.applyPeriodOfDay(result, periodMatch[1]);
                metadata.hasTime = true;
                metadata.period = periodMatch[1];
            }

            // Validate final date
            if (isNaN(result.getTime())) {
                logger.warn('Invalid date result:', { text, result });
                return {
                    type: 'error',
                    error: 'INVALID_DATE',
                    message: 'Failed to parse valid date'
                };
            }

            logger.debug('Date parsed successfully:', {
                input: text,
                result: result.toISOString(),
                pattern: patternType,
                confidence
            });

            return {
                type: 'date',
                value: result.toISOString(),
                metadata: {
                    pattern: patternType,
                    confidence,
                    hasTime: metadata.hasTime || false,
                    period: metadata.period,
                    originalMatch: metadata.originalMatch
                }
            };

        } catch (error) {
            logger.error('Error in date parser:', {
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

    processPattern(patternName, match, config, baseDate) {
        switch (config.type) {
            case 'absolute': {
                if (patternName === 'iso') {
                    const [_, year, month, day] = match;
                    return {
                        date: new Date(year, month - 1, day),
                        metadata: {
                            originalMatch: match[0]
                        }
                    };
                } else if (patternName === 'short') {
                    let [_, day, month, year] = match;
                    year = year ? (year.length === 2 ? '20' + year : year) : baseDate.getFullYear();
                    return {
                        date: new Date(year, month - 1, day),
                        metadata: {
                            originalMatch: match[0]
                        }
                    };
                }
                break;
            }

            case 'relative': {
                const date = new Date(baseDate);
                switch (patternName) {
                    case 'tomorrow':
                        date.setDate(date.getDate() + 1);
                        break;
                    case 'nextWeek':
                        date.setDate(date.getDate() + 7);
                        break;
                    case 'nextMonth':
                        date.setMonth(date.getMonth() + 1);
                        break;
                }
                return {
                    date,
                    metadata: {
                        originalMatch: match[0]
                    }
                };
            }

            case 'weekday': {
                if (patternName === 'weekend') {
                    return this.calculateWeekendDate(baseDate, match[1]);
                }
                
                const [_, modifier, day] = match;
                return {
                    date: this.calculateWeekdayDate(day.toLowerCase(), modifier, baseDate),
                    metadata: {
                        originalMatch: match[0]
                    }
                };
            }

            case 'duration': {
                const [_, amount, unit] = match;
                const date = new Date(baseDate);
                const value = parseInt(amount, 10);

                switch (unit) {
                    case 'day':
                        date.setDate(date.getDate() + value);
                        break;
                    case 'week':
                        date.setDate(date.getDate() + (value * 7));
                        break;
                    case 'month':
                        date.setMonth(date.getMonth() + value);
                        break;
                    case 'year':
                        date.setFullYear(date.getFullYear() + value);
                        break;
                }

                return {
                    date,
                    metadata: {
                        originalMatch: match[0]
                    }
                };
            }
        }

        return null;
    },

    applyTime(date, timeMatch) {
        let [_, hours, minutes = '0', period] = timeMatch;
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);

        // Convert to 24-hour format
        if (period?.toLowerCase() === 'pm' && hours < 12) {
            hours += 12;
        } else if (period?.toLowerCase() === 'am' && hours === 12) {
            hours = 0;
        }

        date.setHours(hours, minutes, 0, 0);
    },

    applyPeriodOfDay(date, period) {
        const defaultTime = DEFAULT_TIMES[period.toLowerCase()];
        if (defaultTime) {
            date.setHours(defaultTime.hour, defaultTime.minute, 0, 0);
        }
    },

    calculateWeekdayDate(targetDay, modifier, baseDate) {
        const result = new Date(baseDate);
        const currentDay = result.getDay();
        const targetIndex = WEEKDAYS[targetDay];
        
        let daysToAdd = (targetIndex - currentDay + 7) % 7;
        
        if (modifier === 'next' || (daysToAdd === 0 && !modifier)) {
            daysToAdd += 7;
        } else if (modifier === 'last') {
            daysToAdd = daysToAdd - 7;
        }
        
        result.setDate(result.getDate() + daysToAdd);
        return result;
    },

    calculateWeekendDate(baseDate, modifier) {
        const result = new Date(baseDate);
        const currentDay = result.getDay();
        
        // Calculate days until next Saturday
        let daysToAdd = (6 - currentDay + 7) % 7;
        
        if ((currentDay === 6 || currentDay === 0) && !modifier) {
            daysToAdd += 7;
        }
        
        if (modifier === 'next') {
            daysToAdd += 7;
        } else if (modifier === 'last') {
            daysToAdd = daysToAdd - 14;
        }
        
        result.setDate(result.getDate() + daysToAdd);
        return result;
    },

    calculateConfidence(match, fullText, baseConfidence, date) {
        let confidence = baseConfidence;

        // Adjust based on pattern specificity
        if (match.includes(':')) {
            confidence += 0.05; // More specific time format
        }

        // Consider position in text
        const position = fullText.toLowerCase().indexOf(match.toLowerCase());
        const nearKeyword = /\b(?:on|at|by|due)\b/i.test(
            fullText.slice(Math.max(0, position - 5), position)
        );
        
        if (nearKeyword) {
            confidence += 0.05;
        }

        // Adjust for future dates (more likely to be correct)
        const now = new Date();
        if (date > now) {
            confidence += 0.05;
        }

        return Math.min(1, confidence);
    }
};
