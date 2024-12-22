import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';
import { timeToMinutes, validateTime } from '../utils/timeUtils.js';

const logger = createLogger('RemindersParser');

const PATTERNS = {
    // Relative time reminders
    beforeEvent: {
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
    
    // Multiple time reminders
    multipleReminders: {
        pattern: /\bremind(?:\s+me)?\s+(\d+)\s+(?:minutes?|mins?|hours?|hrs?|days?)\s+(?:and|,)\s+(\d+)\s+(?:minutes?|mins?|hours?|hrs?|days?)\s+before\b/i,
        type: 'multiple',
        confidence: 0.85
    },
    
    // Day-based reminders
    onDay: {
        pattern: /\bremind(?:\s+me)?\s+on\s+([^,.]+?)(?=\s*[,.]|$)/i,
        type: 'day',
        confidence: 0.85
    },
    
    // General reminder
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
            let patternType = '';

            // Process each pattern type
            for (const [patternName, config] of Object.entries(PATTERNS)) {
                const matches = Array.from(text.matchAll(config.pattern));
                
                for (const match of matches) {
                    const reminder = this.buildReminder(patternName, match, config);
                    if (!reminder) continue;

                    // Validate reminder before adding
                    const validationResult = this.validateReminder(reminder);
                    if (!validationResult.isValid) {
                        logger.debug('Invalid reminder:', validationResult.error);
                        continue;
                    }

                    const confidence = this.calculateConfidence(
                        match[0],
                        text,
                        config.confidence,
                        reminder
                    );

                    reminder.confidence = confidence;
                    highestConfidence = Math.max(highestConfidence, confidence);
                    patternType = patternName;
                    
                    if (Array.isArray(reminder)) {
                        reminders.push(...reminder);
                    } else {
                        reminders.push(reminder);
                    }
                }
            }

            // If no reminders found, check for implicit reminders
            if (reminders.length === 0) {
                const implicitReminder = this.checkImplicitReminder(text);
                if (implicitReminder) {
                    reminders.push(implicitReminder);
                    highestConfidence = implicitReminder.confidence;
                    patternType = 'implicit';
                }
            }

            if (reminders.length === 0) {
                logger.debug('No reminders found');
                return null;
            }

            // Sort and deduplicate reminders
            reminders = this.consolidateReminders(reminders);

            logger.debug('Reminders parsed:', {
                count: reminders.length,
                types: reminders.map(r => r.type)
            });

            return {
                type: 'reminders',
                value: reminders,
                metadata: {
                    pattern: reminders.length > 1 ? 'multiple' : patternType,
                    confidence: highestConfidence,
                    count: reminders.length,
                    types: Array.from(new Set(reminders.map(r => r.type))),
                    hasAbsoluteTime: reminders.some(r => r.type === 'absolute'),
                    hasRelativeTime: reminders.some(r => r.type === 'relative')
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
                    time: { hours, minutes },
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

                return reminders;
            }

            case 'day': {
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

    validateReminder(reminder) {
        if (reminder.type === 'relative') {
            if (!reminder.minutes || reminder.minutes <= 0) {
                return {
                    isValid: false,
                    error: 'Invalid duration'
                };
            }
        } else if (reminder.type === 'absolute') {
            if (!validateTime(reminder.time)) {
                return {
                    isValid: false,
                    error: 'Invalid time'
                };
            }
        }

        return { isValid: true };
    },

    convertToMinutes(amount, unit) {
        return amount * (TIME_UNITS[unit] || 1);
    },

    calculateConfidence(match, fullText, baseConfidence, reminder) {
        let confidence = baseConfidence;

        // Adjust based on reminder specificity
        if (reminder.type === 'absolute') {
            confidence += 0.1; // Absolute times are more specific
        } else if (reminder.type === 'relative' && reminder.minutes < 60) {
            confidence += 0.05; // Minute-level precision
        }

        // Consider position
        const position = fullText.toLowerCase().indexOf(match.toLowerCase());
        if (position > fullText.length * 0.7) {
            confidence += 0.05; // Reminders often specified at end
        }

        // Multiple reminders indicate stronger intent
        if (Array.isArray(reminder)) {
            confidence += 0.05;
        }

        return Math.min(1, confidence);
    },

    checkImplicitReminder(text) {
        // Check for action words that imply reminders
        if (/\b(?:call|meet|appointment|deadline)\b/i.test(text)) {
            return {
                type: 'implicit',
                value: true,
                confidence: 0.6,
                originalValue: 'implicit reminder'
            };
        }
        return null;
    },

    consolidateReminders(reminders) {
        // Flatten any nested arrays
        reminders = reminders.reduce((acc, reminder) => {
            if (Array.isArray(reminder)) {
                acc.push(...reminder);
            } else {
                acc.push(reminder);
            }
            return acc;
        }, []);

        // Remove duplicates
        const seen = new Set();
        reminders = reminders.filter(reminder => {
            const key = `${reminder.type}-${JSON.stringify(reminder.time || reminder.minutes)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        // Sort by time (absolute times first, then relative times by duration)
        return reminders.sort((a, b) => {
            if (a.type === 'absolute' && b.type === 'absolute') {
                return (a.time.hours * 60 + a.time.minutes) - 
                       (b.time.hours * 60 + b.time.minutes);
            }
            if (a.type === 'relative' && b.type === 'relative') {
                return b.minutes - a.minutes;
            }
            return a.type === 'absolute' ? -1 : 1;
        });
    }
};
