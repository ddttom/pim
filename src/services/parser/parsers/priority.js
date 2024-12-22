import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('PriorityParser');

const PRIORITY_PATTERNS = {
    explicit: /\b(?:priority|pri):\s*(high|medium|low|urgent|normal)\b/i,
    prefix: /\b(high|medium|low|urgent|normal)\s+priority\b/i,
    shorthand: /\b(!{1,3})\b/,
    numeric: /\bp(\d)\b/i,
    contextual: /\b(?:asap|urgent|critical|blocking)\b/i
};

const PRIORITY_LEVELS = {
    urgent: 1,
    high: 2,
    medium: 3,
    normal: 4,
    low: 5
};

export const name = 'priority';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    try {
        for (const [type, pattern] of Object.entries(PRIORITY_PATTERNS)) {
            const matches = text.match(pattern);
            if (matches) {
                const value = await extractPriorityValue(matches, type);
                if (value) {
                    const confidence = calculateConfidence(matches, text, type);
                    return {
                        type: 'priority',
                        value,
                        metadata: {
                            pattern: type,
                            confidence,
                            originalMatch: matches[0],
                            level: PRIORITY_LEVELS[value.priority] || null
                        }
                    };
                }
            }
        }

        return null;
    } catch (error) {
        logger.error('Error in priority parser:', error);
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}

async function extractPriorityValue(matches, type) {
    try {
        switch (type) {
            case 'explicit':
            case 'prefix': {
                const priority = matches[1]?.toLowerCase();
                if (priority === 'urgent') return { priority: 'urgent' };
                return { priority };
            }

            case 'shorthand': {
                const exclamations = matches[1].length;
                switch (exclamations) {
                    case 3: return { priority: 'urgent' };
                    case 2: return { priority: 'high' };
                    case 1: return { priority: 'medium' };
                    default: return null;
                }
            }

            case 'numeric': {
                const level = parseInt(matches[1], 10);
                if (level < 1 || level > 5) return null;
                const priorities = ['urgent', 'high', 'medium', 'normal', 'low'];
                return { priority: priorities[level - 1] };
            }

            case 'contextual': {
                const term = matches[0].toLowerCase();
                if (term === 'asap' || term === 'urgent' || term === 'critical') {
                    return { priority: 'urgent' };
                }
                if (term === 'blocking') {
                    return { priority: 'high' };
                }
                return null;
            }

            default:
                return null;
        }
    } catch (error) {
        logger.warn('Priority extraction failed:', { matches, type, error });
        return null;
    }
}

function calculateConfidence(matches, text, type) {
    let confidence = 0.7;

    // Pattern-based confidence
    switch (type) {
        case 'explicit': confidence += 0.2; break;
        case 'prefix': confidence += 0.15; break;
        case 'shorthand': confidence += 0.1; break;
        case 'numeric': confidence += 0.1; break;
        case 'contextual': confidence += 0.05; break;
    }

    // Position-based confidence
    if (matches.index === 0) confidence += 0.1;
    if (text[matches.index - 1] === ' ') confidence += 0.05;

    return Math.min(confidence, 1.0);
}
