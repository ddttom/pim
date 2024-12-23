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

    const patterns = {
        explicit_category: /\[category:([^\]]+)\]/gi,
        hashtag: /#([a-zA-Z]\w*)/g,
        nested: /\b(in|under|for)\s+([a-zA-Z]\w*(?:\/[a-zA-Z]\w*)*)\b/gi
    };

    const results = [];

    for (const [pattern, regex] of Object.entries(patterns)) {
        const matches = Array.from(text.matchAll(regex));
        
        for (const match of matches) {
            let value;
            let confidence;

            switch (pattern) {
                case 'explicit_category': {
                    const categories = match[1].split('/').map(c => c.trim());
                    confidence = 0.95;
                    value = {
                        path: categories,
                        name: categories[categories.length - 1]
                    };
                    break;
                }

                case 'hashtag': {
                    confidence = 0.9;
                    value = {
                        path: [match[1]],
                        name: match[1]
                    };
                    break;
                }

                case 'nested': {
                    const categories = match[2].split('/').map(c => c.trim());
                    confidence = 0.85;
                    value = {
                        path: categories,
                        name: categories[categories.length - 1]
                    };
                    break;
                }
            }

            results.push({
                type: 'category',
                value,
                metadata: {
                    confidence,
                    pattern,
                    originalMatch: match[0]
                }
            });
        }
    }

    return results.length > 0 ? results : null;
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
