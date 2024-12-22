import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('CategoriesParser');

// Module-level pattern definitions
const CATEGORY_PATTERNS = {
    standard: /\bcategory:\s*([^:\n]+)(?:\n|$)/i,
    tag: /#([a-z]\w+)/gi,
    section: /\bsection:\s*([^:\n]+)(?:\n|$)/i,
    type: /\btype:\s*([^:\n]+)(?:\n|$)/i
};

export const name = 'categories';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    const results = [];

    for (const [type, pattern] of Object.entries(CATEGORY_PATTERNS)) {
        const matches = Array.from(text.matchAll(pattern));
        for (const match of matches) {
            const value = await extractValue(match);
            const confidence = calculateConfidence(match, text, type);

            results.push({
                type: 'category',
                subtype: type,
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
    return match[1].toLowerCase().trim();
}

function calculateConfidence(match, fullText, type) {
    let confidence = 0.7;

    // Increase confidence based on format and context
    switch (type) {
        case 'standard':
            confidence += 0.2; // Explicit category marker
            break;
        case 'tag':
            confidence += 0.15; // Common hashtag format
            break;
        case 'section':
        case 'type':
            confidence += 0.1; // Alternative category markers
            break;
    }

    // Position-based confidence
    if (match.index === 0 || fullText[match.index - 1] === '\n') {
        confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
}
