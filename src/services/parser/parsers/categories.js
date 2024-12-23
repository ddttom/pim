import { createLogger } from '../../../utils/logger.js';
const logger = createLogger('CategoriesParser');

export const name = 'categories';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    const patterns = {
        nested_category: /\[category:([^\]\/]+(?:\/[^\]\/]+)+)\]/i,
        multiple_categories: /(?:\[category:([^\]]+)\][\s,]*){2,}/i,
        explicit_category: /\[category:([^\]\/]+)\]/i,
        inferred_category: /#([a-zA-Z]\w*)/i
    };

    let bestMatch = null;
    let highestConfidence = 0;

    for (const [pattern, regex] of Object.entries(patterns)) {
        const match = text.match(regex);
        if (match) {
            let confidence;
            let value;

            switch (pattern) {
                case 'nested_category': {
                    confidence = 0.95;
                    const parts = match[1].split('/').map(p => p.trim());
                    value = {
                        category: parts[0],
                        subcategories: parts.slice(1)
                    };
                    break;
                }

                case 'multiple_categories': {
                    confidence = 0.9;
                    const categoryRegex = /\[category:([^\]]+)\]/g;
                    const categories = [];
                    let m;
                    while ((m = categoryRegex.exec(match[0])) !== null) {
                        categories.push(m[1].trim());
                    }
                    value = { categories };
                    break;
                }

                case 'explicit_category': {
                    confidence = 0.9;
                    value = {
                        category: match[1].trim(),
                        subcategories: []
                    };
                    break;
                }

                case 'inferred_category': {
                    confidence = 0.8;
                    value = {
                        category: match[1],
                        subcategories: []
                    };
                    break;
                }
            }

            if (confidence > highestConfidence) {
                highestConfidence = confidence;
                bestMatch = {
                    type: 'category',
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
