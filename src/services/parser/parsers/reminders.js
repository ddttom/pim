import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';
import { timeToMinutes } from '../utils/timeUtils.js';

const logger = createLogger('RemindersParser');

const PATTERNS = {
    // Relative time reminders
    beforeRelative: {
        pattern: /\bremind(?:\s+me)?\s+(\d+)\s+(minutes?|mins?|hours?|hrs?|days?)\s+before\b/i,
        type: 'relative',
        confidence: 0.9
    },
    
    // Absolute time reminders
    atTime: {
        pattern: /\bremind(?:\s+me)?\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
        type: 'absolute',
        confidence: 0.9
    },
    
    // Day-based reminders
    onDay: {
        pattern: /\bremind(?:\s+me)?\s+on\s+([^,.]+?)(?=\s*[,.]|$)/i,
        type: 'day',
        confidence: 0.85
    },
    
    // Multiple reminders
    multiple: {
        pattern: /\bremind(?:\s+me)?\s+(?:(\d+)\s+(?:minutes?|mins?|hours?|hrs?|days?)\s+(?:and|,)\s+)?(\d+)\s+(?:minutes?|mins?|hours?|hrs?|days?)\s+before\b/i,
        type: 'multiple',
        confidence: 0.85
    },
    
    // General reminder requests
    general: {
        pattern: /\bplease\s+remind(?:\s+me)?\b/i,
        type: 'general',
        confidence: 0.7
    }
};

const TIME_UNITS = {
    minute: 1,
    min: 1,
    hour: 60,
    hr: 60,
    day: 1440
};

export default {
    name: 'reminders',
    
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
            let reminders = [];
            let highestConfidence = 0;

            // Check each pattern
            for (const [patternName, config] of Object.entries(PATTERNS)) {
                const matches = text.matchAll(config.pattern);
                
                for (const match of matches) {
                    const reminder = this.buildReminder(patternName, match, config);
                    if (!reminder) continue;

                    // Calculate confidence
                    const confidence = this.calculateConfidence(
                        match[0],
                        text,
                        config.confidence,
                        reminder
                    );

                    highestConfidence = Math.max(highestConfidence, confidence);
                    reminder.confidence = confidence;
                    
                    reminders.push(reminder);
                }
            }

            // Handle multiple reminders from same match
            reminders = this.consolidateReminders(reminders);

            if (reminders.length === 0) {
                logger.debug('No reminders found');
                return null;
            }

            logger.debug('Reminders parsed:', {
                count: reminders.length,
                types: reminders.map(r => r.type)
            });

            return {
                type: 'reminders',
                value: reminders,
                metadata: {
                    pattern: reminders.length > 1 ? 'multiple' : reminders[0].type,
                    confidence: highestConfidence,
                    count: reminders.length,
                    types: Array.from(new Set(reminders.map(r => r.type)))
                }
            };

        } catch (error) {
            logger.error('Error in reminders parser:', {
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

    buildReminder(patternName, match, config) {
        switch (config.type) {
            case 'relative': {
                const amount = parseInt(match[1], 10);
                const unit = match[2].toLowerCase().replace(/s$/, '');
                const minutes = this.convertToMinutes(amount, unit);
                
                return {
                    type: 'relative',
                    minutes,
                    originalValue: `${amount} ${match[2]}`,
                    beforeEvent: true
                };
            }

            case 'absolute': {
                let [_, hours, minutes = '0', period] = match;
                hours = parseInt(hours, 10);
                minutes = parseInt(minutes, 10);

                // Convert to 24-hour format
                if (period?.toLowerCase() === 'pm' && hours < 12) {
                    hours += 12;
                } else if (period?.toLowerCase() === 'am' && hours === 12) {
                    hours = 0;
                }

                return {
                    type: 'absolute',
                    time: {
                        hours,
                        minutes
                    },
                    originalValue: match[0]
                };
            }

            case 'multiple': {
                const reminders = [];
                let current = 1;
                
                while (match[current]) {
                    const amount = parseInt(match[current], 10);
                    const unit = match[current + 1]?.toLowerCase().replace(/s$/, '');
                    if (amount && unit) {
                        reminders.push({
                            type: 'relative',
                            minutes: this.convertToMinutes(amount, unit),
                            originalValue: `${amount} ${match[current + 1]}`,
                            beforeEvent: true
                        });
                    }
                    current += 2;
                }

                return reminders.length > 0 ? reminders : null;
            }

            case 'day': {
                // This would ideally use the date parser to parse the day
                return {
                    type: 'day',
                    value: match[1].trim(),
                    originalValue: match[0]
                };
            }

            case 'general': {
                return {
                    type: 'general',
                    value: true,
                    originalValue: match[0]
                };
            }

            default:
                return null;
        }
    },

    convertToMinutes(amount, unit) {
        return amount * (TIME_UNITS[unit] || 1);
    },

    calculateConfidence(match, fullText, baseConfidence, reminder) {
        let confidence = baseConfidence;

        // Adjust based on reminder specificity
        if (reminder.type === 'absolute') {
            confidence += 0.1; // Absolute times are more specific
        }
        if (Array.isArray(reminder)) {
            confidence += 0.05; // Multiple reminders show intent
        }

        // Adjust based on time precision
        if (reminder.type === 'relative' && reminder.minutes < 60) {
            confidence += 0.05; // Minute-level precision
        }

        // Position-based adjustments
        const position = fullText.toLowerCase().indexOf(match.toLowerCase());
        const isNearEnd = position > fullText.length * 0.7;
        if (isNearEnd) confidence += 0.05; // Reminders often specified at end

        return Math.min(1, confidence);
    },

    consolidateReminders(reminders) {
        // Flatten any arrays from multiple reminders
        reminders = reminders.reduce((acc, reminder) => {
            if (Array.isArray(reminder)) {
                acc.push(...reminder);
            } else {
                acc.push(reminder);
            }
            return acc;
        }, []);

        // Sort by minutes (for relative) or time (for absolute)
        return reminders.sort((a, b) => {
            if (a.type === 'relative' && b.type === 'relative') {
                return b.minutes - a.minutes;
            }
            if (a.type === 'absolute' && b.type === 'absolute') {
                return (a.time.hours * 60 + a.time.minutes) - 
                       (b.time.hours * 60 + b.time.minutes);
            }
            return 0;
        });
    }
};
