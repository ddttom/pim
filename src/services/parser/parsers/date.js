import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence, SHARED_PATTERNS } from '../utils/patterns.js';
import { timeToMinutes } from '../utils/timeUtils.js';

const logger = createLogger('DateParser');

const PATTERNS = {
    // Absolute dates
    isoDate: /\b(\d{4})-(\d{2})-(\d{2})\b/,
    shortDate: /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?\b/,
    
    // Relative dates
    relative: {
        today: /\b(?:today|now)\b/i,
        tomorrow: /\btomorrow\b/i,
        nextWeek: /\bnext\s+week\b/i,
        nextMonth: /\bnext\s+month\b/i,
        nextYear: /\bnext\s+year\b/i
    },
    
    // Day references
    weekday: /\b(?:this|next|last)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    weekend: /\b(?:this|next|last)?\s*weekend\b/i,
    
    // Time references
    timeOfDay: /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
    period: /\b(morning|afternoon|evening|night)\b/i,
    
    // Duration-based
    inDuration: /\bin\s+(\d+)\s+(day|week|month|year)s?\b/i,
    afterDuration: /\bafter\s+(\d+)\s+(day|week|month|year)s?\b/i
};

// Default times for periods of day
const DEFAULT_TIMES = {
    morning: { hour: 9, minute: 0 },
    afternoon: { hour: 14, minute: 0 },
    evening: { hour: 18, minute: 0 },
    night: { hour: 20, minute: 0 }
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
            // Base date for relative calculations
            const now = new Date();
            let result = null;
            let pattern = '';
            let confidence = 0.5;

            // Check ISO date format first (highest confidence)
            const isoMatch = text.match(PATTERNS.isoDate);
            if (isoMatch) {
                const [_, year, month, day] = isoMatch;
                result = new Date(year, month - 1, day);
                pattern = 'iso';
                confidence = 0.9;
            }
            
            // Check short date format
            if (!result) {
                const shortMatch = text.match(PATTERNS.shortDate);
                if (shortMatch) {
                    let [_, day, month, year] = shortMatch;
                    year = year ? (year.length === 2 ? '20' + year : year) : now.getFullYear();
                    result = new Date(year, month - 1, day);
                    pattern = 'short';
                    confidence = 0.8;
                }
            }

            // Check relative dates
            if (!result) {
                for (const [key, pattern] of Object.entries(PATTERNS.relative)) {
                    const match = text.match(pattern);
                    if (match) {
                        result = this.calculateRelativeDate(key, now);
                        pattern = key;
                        confidence = 0.7;
                        break;
                    }
                }
            }

            // Check weekday references
            if (!result) {
                const weekdayMatch = text.match(PATTERNS.weekday);
                if (weekdayMatch) {
                    const [_, modifier, day] = weekdayMatch;
                    result = this.calculateWeekdayDate(day, modifier, now);
                    pattern = 'weekday';
                    confidence = 0.7;
                }
            }

            // If we found a date, check for time specification
            if (result) {
                const timeMatch = text.match(PATTERNS.timeOfDay);
                if (timeMatch) {
                    const [_, hours, minutes, period] = timeMatch;
                    this.applyTime(result, hours, minutes, period);
                    confidence += 0.1; // Higher confidence with specific time
                }
                
                const periodMatch = text.match(PATTERNS.period);
                if (periodMatch && !timeMatch) {
                    const period = periodMatch[1].toLowerCase();
                    const defaultTime = DEFAULT_TIMES[period];
                    if (defaultTime) {
                        result.setHours(defaultTime.hour, defaultTime.minute);
                    }
                }
            }

            if (!result) {
                logger.debug('No date pattern matches found');
                return null;
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
                pattern,
                confidence
            });

            return {
                type: 'date',
                value: result.toISOString(),
                metadata: {
                    pattern,
                    confidence,
                    hasTime: Boolean(timeMatch || periodMatch)
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

    calculateRelativeDate(key, baseDate) {
        const result = new Date(baseDate);
        
        switch (key) {
            case 'today':
                break;
            case 'tomorrow':
                result.setDate(result.getDate() + 1);
                break;
            case 'nextWeek':
                result.setDate(result.getDate() + 7);
                break;
            case 'nextMonth':
                result.setMonth(result.getMonth() + 1);
                break;
            case 'nextYear':
                result.setFullYear(result.getFullYear() + 1);
                break;
        }
        
        return result;
    },

    calculateWeekdayDate(targetDay, modifier, baseDate) {
        const result = new Date(baseDate);
        const currentDay = result.getDay();
        const targetIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
            .indexOf(targetDay.toLowerCase());
        
        let daysToAdd = (targetIndex - currentDay + 7) % 7;
        
        if (modifier === 'next' || (daysToAdd === 0 && !modifier)) {
            daysToAdd += 7;
        }
        
        result.setDate(result.getDate() + daysToAdd);
        return result;
    },

    applyTime(date, hours, minutes = '0', period) {
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);
        
        // Convert to 24-hour format
        if (period && period.toLowerCase() === 'pm' && hours < 12) {
            hours += 12;
        } else if (period && period.toLowerCase() === 'am' && hours === 12) {
            hours = 0;
        }
        
        date.setHours(hours, minutes, 0, 0);
    }
};
