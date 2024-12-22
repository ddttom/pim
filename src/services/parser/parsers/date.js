import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('DateParser');

const DATE_PATTERNS = {
    iso: /\b(\d{4}-\d{2}-\d{2})\b/,
    natural: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* (\d{1,2})(?:st|nd|rd|th)?,? (\d{4})\b/i,
    relative: /\b(today|tomorrow|yesterday)\b/i,
    deadline: /\bdue:?\s*([^:\n]+)(?:\n|$)/i,
    scheduled: /\bscheduled?:?\s*([^:\n]+)(?:\n|$)/i
};

const MONTHS = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
};

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
                const value = await extractDateValue(matches, type);
                if (value) {
                    const confidence = calculateConfidence(matches, text, type);
                    return {
                        type: 'date',
                        value,
                        metadata: {
                            pattern: type,
                            confidence,
                            originalMatch: matches[0],
                            format: type
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

async function extractDateValue(matches, type) {
    try {
        switch (type) {
            case 'iso':
                return validateAndFormatDate(new Date(matches[1]));

            case 'natural': {
                const month = MONTHS[matches[1].toLowerCase().slice(0, 3)];
                const day = parseInt(matches[2], 10);
                const year = parseInt(matches[3], 10);
                return validateAndFormatDate(new Date(year, month, day));
            }

            case 'relative': {
                const date = new Date();
                switch (matches[1].toLowerCase()) {
                    case 'tomorrow': date.setDate(date.getDate() + 1); break;
                    case 'yesterday': date.setDate(date.getDate() - 1); break;
                }
                return validateAndFormatDate(date);
            }

            case 'deadline':
            case 'scheduled': {
                const parsed = new Date(matches[1]);
                return parsed.toString() !== 'Invalid Date' ? validateAndFormatDate(parsed) : null;
            }

            default:
                return null;
        }
    } catch (error) {
        logger.warn('Date extraction failed:', { matches, type, error });
        return null;
    }
}

function validateAndFormatDate(date) {
    if (date.toString() === 'Invalid Date') {
        throw new Error('Invalid date format');
    }
    return date.toISOString().split('T')[0];
}

function calculateConfidence(matches, text, type) {
    let confidence = 0.7;

    // Pattern-based confidence
    switch (type) {
        case 'iso': confidence += 0.2; break;
        case 'natural': confidence += 0.15; break;
        case 'relative': confidence += 0.1; break;
        case 'deadline':
        case 'scheduled': confidence += 0.15; break;
    }

    // Position-based confidence
    if (matches.index === 0) confidence += 0.1;
    if (text[matches.index - 1] === ' ') confidence += 0.05;

    return Math.min(confidence, 1.0);
}
