import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ContextParser');

export const name = 'context';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    const patterns = {
        explicit: /\[context:([^\]]+)\]/i,
        at: /\bat\s+([^,.]+)(?:[,.]|\s|$)/i,
        in: /\bin\s+([^,.]+)(?:[,.]|\s|$)/i,
        during: /\bduring\s+([^,.]+)(?:[,.]|\s|$)/i,
        using: /\busing\s+([^,.]+)(?:[,.]|\s|$)/i
    };

    try {
        for (const [type, pattern] of Object.entries(patterns)) {
            const match = text.match(pattern);
            if (match) {
                const context = match[1].trim();
                return {
                    type: 'context',
                    value: {
                        context,
                        type: inferContextType(context)
                    },
                    metadata: {
                        confidence: calculateConfidence(type, context),
                        pattern: type,
                        originalMatch: match[0]
                    }
                };
            }
        }
        
        return null;
    } catch (error) {
        logger.error('Error in context parser:', {
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
}

function inferContextType(context) {
    const types = {
        location: /(?:room|office|building|home|work)/i,
        time: /(?:morning|afternoon|evening|night|day|week)/i,
        tool: /(?:computer|laptop|phone|device|software|app)/i,
        activity: /(?:meeting|call|lunch|break|session)/i
    };

    for (const [type, pattern] of Object.entries(types)) {
        if (pattern.test(context)) {
            return type;
        }
    }

    return 'general';
}

function calculateConfidence(type, context) {
    // Base confidence
    let confidence = type === 'explicit' ? 0.95 : 0.75;
    
    // Boost confidence for well-known context types
    if (inferContextType(context) !== 'general') {
        // For explicit patterns, can go above 0.9
        // For inferred patterns, stay at or below 0.8
        const maxConfidence = type === 'explicit' ? 1.0 : 0.8;
        confidence = Math.min(confidence + 0.05, maxConfidence);
    }
    
    return confidence;
}
