import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch } from '../utils/patterns.js';

const logger = createLogger('DurationParser');

const DURATION_PATTERNS = {
    explicit_duration: /\[duration:(\d+)(?:h(?:\s*(\d+)m)?|m)\]/i,
    time_range: /(\d{1,2}):(\d{2})\s*(?:-|to)\s*(\d{1,2}):(\d{2})/i,
    natural: /(\d+)\s*(hours?|minutes?|hrs?|mins?)(?:\s*(?:and|,)\s*(\d+)\s*(minutes?|mins?))?/i,
    short_duration: /(\d+(?:\.\d+)?)(h|m)/i
};

const UNIT_MULTIPLIERS = {
    h: 60,  // hours to minutes
    m: 1,   // minutes
    d: 1440 // days to minutes
};

export const name = 'duration';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    let bestMatch = null;
    let highestConfidence = 0;

    for (const [pattern, regex] of Object.entries(DURATION_PATTERNS)) {
        const match = text.match(regex);
        if (match) {
            let confidence;
            let value;

            switch (pattern) {
                case 'explicit_duration': {
                    confidence = 0.95;
                    const hours = parseInt(match[1], 10);
                    const minutes = match[2] ? parseInt(match[2], 10) : 0;
                    const totalMinutes = hours * 60 + minutes;
                    value = { hours, minutes, totalMinutes };
                    break;
                }

                case 'time_range': {
                    confidence = 0.90;
                    const startHour = parseInt(match[1], 10);
                    const startMin = parseInt(match[2], 10);
                    const endHour = parseInt(match[3], 10);
                    const endMin = parseInt(match[4], 10);
                    
                    const startMins = startHour * 60 + startMin;
                    const endMins = endHour * 60 + endMin;
                    const totalMinutes = endMins - startMins;
                    
                    value = {
                        hours: Math.floor(totalMinutes / 60),
                        minutes: totalMinutes % 60,
                        totalMinutes
                    };
                    break;
                }

                case 'natural': {
                    confidence = 0.85;
                    const firstNum = parseInt(match[1], 10);
                    const firstUnit = match[2].toLowerCase();
                    const secondNum = match[3] ? parseInt(match[3], 10) : 0;
                    
                    let hours = 0;
                    let minutes = 0;
                    
                    if (firstUnit.startsWith('h')) {
                        hours = firstNum;
                        minutes = secondNum;
                    } else {
                        minutes = firstNum + secondNum;
                    }
                    
                    value = {
                        hours,
                        minutes,
                        totalMinutes: hours * 60 + minutes
                    };
                    break;
                }

                case 'short_duration': {
                    confidence = 0.90;
                    const amount = parseFloat(match[1]);
                    const unit = match[2].toLowerCase();
                    
                    if (unit === 'h') {
                        const hours = Math.floor(amount);
                        const minutes = Math.round((amount - hours) * 60);
                        value = {
                            hours,
                            minutes,
                            totalMinutes: hours * 60 + minutes
                        };
                    } else {
                        value = {
                            hours: 0,
                            minutes: amount,
                            totalMinutes: amount
                        };
                    }
                    break;
                }
            }

            if (value && confidence > highestConfidence) {
                highestConfidence = confidence;
                bestMatch = {
                    type: 'duration',
                    value,
                    metadata: {
                        confidence,
                        pattern,
                        originalMatch: match[0]
                    }
                };
            }
        }
    }

    return bestMatch;
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

function isValidDuration(hours, minutes) {
    return hours >= 0 && hours <= 24 && minutes >= 0 && minutes < 60;
}
