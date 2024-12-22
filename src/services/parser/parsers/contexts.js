import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('ContextsParser');

const CONTEXT_PATTERNS = {
    standard: /@(\w+)/g,
    detailed: /\bcontext:\s*([^:\n]+)(?:\n|$)/i,
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
            const confidence = calculateConfidence(match, text);

            results.push({
                type: 'context',
                value,
                confidence,
                metadata: {
                    pattern: pattern.source,
                    originalMatch: match[0],
                    format: type
                }
            });
        }
    }

    return results;
}

function extractValue(match) {
    return match[1].toLowerCase();
}

function calculateConfidence(match, fullText) {
    let confidence = 0.7;

    // Increase confidence based on format and position
    if (match[0].startsWith('@')) confidence += 0.2;
    if (match.index === 0 || fullText[match.index - 1] === ' ') confidence += 0.1;

    return Math.min(confidence, 1.0);
}
