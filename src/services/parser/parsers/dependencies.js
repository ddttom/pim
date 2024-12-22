import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('DependenciesParser');

const DEPENDENCY_PATTERNS = {
    requires: /\brequires:\s*([^:\n]+)(?:\n|$)/i,
    depends: /\bdepends on:\s*([^:\n]+)(?:\n|$)/i,
    blocked: /\bblocked by:\s*([^:\n]+)(?:\n|$)/i,
    references: /\breferences?:\s*([^:\n]+)(?:\n|$)/i
};

export const name = 'dependencies';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    const results = [];

    for (const [type, pattern] of Object.entries(DEPENDENCY_PATTERNS)) {
        const matches = text.match(pattern);
        if (matches) {
            const value = await extractValue(matches);
            const confidence = calculateConfidence(matches, text);

            results.push({
                type: 'dependency',
                subtype: type,
                value,
                confidence,
                metadata: {
                    pattern: pattern.source,
                    originalMatch: matches[0],
                    dependencyCount: value.length
                }
            });
        }
    }

    return results;
}

function extractValue(matches) {
    return matches[1]
        .split(/[,;]/)
        .map(dep => dep.trim())
        .filter(dep => dep.length > 0);
}

function calculateConfidence(matches, fullText) {
    let confidence = 0.7;

    // Increase confidence based on format and position
    if (matches.index === 0 || fullText[matches.index - 1] === '\n') confidence += 0.1;
    if (matches[0].toLowerCase().includes('depends')) confidence += 0.1;
    if (matches[1].includes(',') || matches[1].includes(';')) confidence += 0.1;

    return Math.min(confidence, 1.0);
}
