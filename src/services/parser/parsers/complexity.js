import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ComplexityParser');

const COMPLEXITY_PATTERNS = {
    points: /\bcomplexity:\s*(\d+)\s*(?:points?)?\b/i,
    level: /\bcomplexity:\s*(high|medium|low)\b/i,
    scale: /\bcomplexity:\s*(\d+)\/(\d+)\b/i
};

const COMPLEXITY_LEVELS = {
    low: 1,
    medium: 2,
    high: 3
};

export const name = 'complexity';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    const results = [];

    for (const [type, pattern] of Object.entries(COMPLEXITY_PATTERNS)) {
        const matches = text.match(pattern);
        if (matches) {
            const value = await extractValue(matches, type);
            const confidence = calculateConfidence(matches, text);

            results.push({
                type: 'complexity',
                value,
                confidence,
                metadata: {
                    pattern: pattern.source,
                    originalMatch: matches[0],
                    format: type
                }
            });
        }
    }

    return results;
}

function extractValue(matches, type) {
    switch (type) {
        case 'points':
            return parseInt(matches[1], 10);
        case 'level':
            return COMPLEXITY_LEVELS[matches[1].toLowerCase()];
        case 'scale':
            return parseInt(matches[1], 10) / parseInt(matches[2], 10);
        default:
            return null;
    }
}

function calculateConfidence(matches, fullText) {
    let confidence = 0.7;

    // Increase confidence based on format and position
    if (matches.index === 0 || fullText[matches.index - 1] === '\n') confidence += 0.1;
    if (/^\d+$/.test(matches[1])) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
}
