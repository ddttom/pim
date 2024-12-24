import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('DateParser');

const DATE_PATTERNS = {
    deadline: /\b(?:due|deadline):\s*([^.,\n]+)/i,
    scheduled: /\b(?:scheduled|planned):\s*([^.,\n]+)/i,
    iso: /\b(\d{4}-\d{2}-\d{2})\b/,
    natural: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* (\d{1,2})(?:st|nd|rd|th)?,? (\d{4})\b/i,
    relative: /\b(today|tomorrow|yesterday)\b/i,
    next_weekday: /\b(next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i
};

const MONTHS = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const name = 'date';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    try {
        for (const [type, pattern] of Object.entries(DATE_PATTERNS)) {
            const matches = text.match(pattern);
            if (matches) {
                const result = await extractDateValue(matches, type);
                if (result && result.value) {
                    return {
                        type: 'date',
                        value: result.value,
                        metadata: {
                            pattern: result.pattern || type,
                            confidence: calculateConfidence(matches, text, type),
                            originalMatch: matches[0],
                            format: type === 'deadline' || type === 'scheduled' ? type : (result.format || type)
                        }
                    };
                }
            }
        }

        return null;
    } catch (error) {
        logger.error('Error in date parser:', error);
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}

async function extractDateValue(matches, type, parentType = null) {
    try {
        switch (type) {
            case 'iso': {
                const [year, month, day] = matches[1].split('-').map(Number);
                if (!isValidDateComponents(year, month, day)) {
                    return null;
                }
                const date = validateAndFormatDate(new Date(year, month - 1, day));
                return date ? { value: date, pattern: type, format: parentType || type } : null;
            }

            case 'natural': {
                const month = MONTHS[matches[1].toLowerCase().slice(0, 3)] + 1;
                const day = parseInt(matches[2], 10);
                const year = parseInt(matches[3], 10);
                if (!isValidDateComponents(year, month, day)) {
                    return null;
                }
                const date = validateAndFormatDate(new Date(year, month - 1, day));
                return date ? { value: date, pattern: type, format: parentType || type } : null;
            }

            case 'relative': {
                const date = new Date();
                const text = matches[1].toLowerCase();
                if (text === 'tomorrow') {
                    date.setDate(date.getDate() + 1);
                } else if (text === 'yesterday') {
                    date.setDate(date.getDate() - 1);
                }
                const formattedDate = validateAndFormatDate(date);
                return formattedDate ? { value: formattedDate, pattern: type, format: parentType || type } : null;
            }

            case 'next_weekday': {
                const date = new Date();
                const weekday = matches[1].toLowerCase().split(' ')[1];
                const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                    .indexOf(weekday);
                if (targetDay !== -1) {
                    const currentDay = date.getDay();
                    const daysToAdd = (targetDay + 7 - currentDay) % 7;
                    date.setDate(date.getDate() + daysToAdd);
                    const formattedDate = validateAndFormatDate(date);
                    return formattedDate ? { value: formattedDate, pattern: 'relative', format: parentType || 'relative' } : null;
                }
                return null;
            }

            case 'deadline':
            case 'scheduled': {
                // Try to parse as natural date first
                const naturalMatch = matches[1].match(DATE_PATTERNS.natural);
                if (naturalMatch) {
                    const result = await extractDateValue(naturalMatch, 'natural', type);
                    if (result) {
                        return { ...result, format: type };
                    }
                }
                // Then try as ISO date
                const isoMatch = matches[1].match(DATE_PATTERNS.iso);
                if (isoMatch) {
                    const result = await extractDateValue(isoMatch, 'iso', type);
                    if (result) {
                        return { ...result, format: type };
                    }
                }
                // Finally try as relative date
                const relativeMatch = matches[1].match(DATE_PATTERNS.relative);
                if (relativeMatch) {
                    const result = await extractDateValue(relativeMatch, 'relative', type);
                    if (result) {
                        return { ...result, format: type };
                    }
                }
                return null;
            }

            default:
                return null;
        }
    } catch (error) {
        logger.warn('Date extraction failed:', { matches, type, error });
        return null;
    }
}

function isValidDateComponents(year, month, day) {
    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1) {
        return false;
    }

    // Check days in month, accounting for leap years
    const maxDays = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
    return day <= maxDays;
}

function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function validateAndFormatDate(date) {
    if (!isValidDate(date)) {
        return null;
    }
    return date.toISOString().split('T')[0];
}

function calculateConfidence(matches, text, type) {
    let confidence = 0.7;

    // Pattern-based confidence
    switch (type) {
        case 'iso': confidence = 0.9; break;
        case 'deadline':
        case 'scheduled': confidence = 0.95; break;
        case 'natural': confidence = 0.8; break;
        case 'relative':
        case 'next_weekday': confidence = 0.75; break;
    }

    // Position-based confidence
    if (matches.index === 0) confidence += 0.05;
    if (text[matches.index - 1] === ' ') confidence += 0.05;

    return Math.min(confidence, 1.0);
}

function isValidDate(date) {
    if (!date || date.toString() === 'Invalid Date') {
        return false;
    }

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    
    return isValidDateComponents(year, month, day);
}
