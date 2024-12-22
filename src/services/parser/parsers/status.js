import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('StatusParser');

const STATUS_PATTERNS = {
    explicit: /\bstatus:\s*(pending|started|completed|blocked|cancelled)\b/i,
    progress: /\b(\d{1,3})%\s*(?:complete|done|finished)\b/i,
    state: /\b(?:is|marked\s+as)\s+(pending|started|completed|blocked|cancelled)\b/i,
    shorthand: /\b(?:\[|\()(pending|started|completed|blocked|cancelled)(?:\]|\))\b/i,
    contextual: /\b(?:waiting|blocked|done|finished|cancelled)\b/i
};

const STATUS_LEVELS = {
    pending: 0,
    started: 1,
    blocked: 2,
    completed: 3,
    cancelled: 4
};

export const name = 'status';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    try {
        for (const [type, pattern] of Object.entries(STATUS_PATTERNS)) {
            const matches = text.match(pattern);
            if (matches) {
                const value = await extractStatusValue(matches, type);
                if (value) {
                    const confidence = calculateConfidence(matches, text, type);
                    return {
                        type: 'status',
                        value,
                        metadata: {
                            pattern: type,
                            confidence,
                            originalMatch: matches[0],
                            level: STATUS_LEVELS[value.status] || null
                        }
                    };
                }
            }
        }

        return null;
    } catch (error) {
        logger.error('Error in status parser:', error);
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}

async function extractStatusValue(matches, type) {
    try {
        switch (type) {
            case 'explicit':
            case 'state':
            case 'shorthand': {
                const status = matches[1]?.toLowerCase();
                if (!STATUS_LEVELS.hasOwnProperty(status)) return null;
                return { status };
            }

            case 'progress': {
                const percent = parseInt(matches[1], 10);
                if (percent < 0 || percent > 100) return null;
                return {
                    status: percent === 100 ? 'completed' : 'started',
                    progress: percent
                };
            }

            case 'contextual': {
                const term = matches[0].toLowerCase();
                const mappings = {
                    'waiting': 'blocked',
                    'blocked': 'blocked',
                    'done': 'completed',
                    'finished': 'completed',
                    'cancelled': 'cancelled'
                };
                return mappings[term] ? { status: mappings[term] } : null;
            }

            default:
                return null;
        }
    } catch (error) {
        logger.warn('Status extraction failed:', { matches, type, error });
        return null;
    }
}
