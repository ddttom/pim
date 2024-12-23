import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('ContextsParser');

const CONTEXT_PATTERNS = {
    standard: /@(\w+)/g,
    detailed: /\bcontext:\s*([^:\n]+)(?:\n|$)/gi,
    hashtag: /#context[_-]?(\w+)/gi
};

export const name = 'contexts';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    const results = [];
    
    for (const [type, pattern] of Object.entries(CONTEXT_PATTERNS)) {
        const matches = Array.from(text.matchAll(pattern));
        for (const match of matches) {
            const value = await extractValue(match);
            const baseConfidence = calculateBaseConfidence(match, text);
            const confidence = adjustConfidence(baseConfidence, match, type);

            results.push({
                type: 'context',
                value,
                metadata: {
                    confidence,
                    pattern: type,
                    originalMatch: match[0]
                }
            });
        }
    }

    return results.length > 0 ? results : null;
}

function extractValue(match) {
    return match[1].toLowerCase();
}

function adjustConfidence(baseConfidence, match, type) {
    let confidence = baseConfidence;

    // Increase confidence based on format and position
    if (type === 'standard' && match[0].startsWith('@')) confidence += 0.2;
    if (type === 'detailed') confidence += 0.15;
    if (type === 'hashtag') confidence += 0.1;

    return Math.min(confidence, 1.0);
}
