import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('CostParser');

export const name = 'cost';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    const patterns = {
        explicit: /\[cost:(\$?\d+(?:\.\d{2})?)\]/i,
        natural: /(?:costs?|price):?\s*\$?(\d+(?:\.\d{2})?)/i
    };

    try {
        for (const [type, pattern] of Object.entries(patterns)) {
            const match = text.match(pattern);
            if (match) {
                const value = parseFloat(match[1]);
                return {
                    type: 'cost',
                    value: {
                        amount: value,
                        currency: 'USD'
                    },
                    metadata: {
                        confidence: type === 'explicit' ? 0.95 : 0.8,
                        pattern: type,
                        originalMatch: match[0]
                    }
                };
            }
        }
        
        return null;
    } catch (error) {
        logger.error('Error in cost parser:', {
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
