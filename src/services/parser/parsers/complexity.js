import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ComplexityParser');

export const name = 'complexity';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    const patterns = {
        explicit_complexity: /\[complexity:(high|medium|low)\]/i,
        numeric_complexity: /\[complexity:(\d+)\]/i,
        keyword_complexity: /\b(complex|complicated|simple|easy|difficult|hard|challenging)\b/i
    };

    let bestMatch = null;
    let highestConfidence = 0;

    const complexityLevels = {
        high: 3,
        medium: 2,
        low: 1
    };

    const keywordMap = {
        complex: 'high',
        complicated: 'high',
        difficult: 'high',
        hard: 'high',
        challenging: 'high',
        simple: 'low',
        easy: 'low'
    };

    for (const [pattern, regex] of Object.entries(patterns)) {
        const match = text.match(regex);
        if (match) {
            let confidence;
            let value;

            switch (pattern) {
                case 'explicit_complexity':
                    confidence = 0.9;
                    value = {
                        level: match[1].toLowerCase(),
                        score: complexityLevels[match[1].toLowerCase()]
                    };
                    break;

                case 'numeric_complexity':
                    confidence = 0.95;
                    const score = parseInt(match[1], 10);
                    value = {
                        level: score >= 3 ? 'high' : score >= 2 ? 'medium' : 'low',
                        score
                    };
                    break;

                case 'keyword_complexity':
                    confidence = 0.75;
                    const level = keywordMap[match[1].toLowerCase()];
                    value = {
                        level,
                        score: complexityLevels[level]
                    };
                    break;
            }

            if (confidence > highestConfidence) {
                highestConfidence = confidence;
                bestMatch = {
                    type: 'complexity',
                    value,
                    metadata: {
                        confidence,
                        pattern,
                        originalMatch: match[0]
                    }
                };
            }
        }
    }

    return bestMatch;
}
