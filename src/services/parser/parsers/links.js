import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('LinksParser');

const LINK_PATTERNS = {
    markdown: /\[([^\]]+)\]\(([^\s)]+)\)/g,
    url: /(?:https?:\/\/[^\s<>)"']+)/g,
    file_link: /\[file:([^\]]+)\]/g,
    file_path: /(?:file:\/\/[^\s<>)"']+)/g
};

export const name = 'links';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    try {
        let bestMatch = null;
        let highestConfidence = 0;

        for (const [type, pattern] of Object.entries(LINK_PATTERNS)) {
            const matches = Array.from(text.matchAll(pattern));
            for (const match of matches) {
                const value = extractLinkValue(match, type);
                if (value) {
                    const baseConfidence = calculateBaseConfidence(match, text);
                    const confidence = adjustConfidence(baseConfidence, type, value);
                    
                    if (confidence > highestConfidence) {
                        highestConfidence = confidence;
                        bestMatch = {
                            type: 'link',
                            value,
                            metadata: {
                                pattern: type,
                                confidence,
                                originalMatch: match[0]
                            }
                        };
                    }
                }
            }
        }

        return bestMatch;
    } catch (error) {
        logger.error('Error in links parser:', { error: error.message, stack: error.stack });
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}

function extractLinkValue(match, type) {
    try {
        switch (type) {
            case 'markdown':
                return {
                    type: 'markdown',
                    text: match[1],
                    url: match[2]
                };
            case 'url':
                return {
                    type: 'url',
                    url: match[0]
                };
            case 'file_link':
            case 'file_path':
                return {
                    type: 'file',
                    path: type === 'file_link' ? match[1] : match[0].replace(/^file:\/\//, '')
                };
            default:
                return null;
        }
    } catch (error) {
        logger.warn('Link extraction failed:', { match, type, error });
        return null;
    }
}

function adjustConfidence(baseConfidence, type, value) {
    let confidence = baseConfidence;

    // Adjust based on link type
    switch (type) {
        case 'markdown':
            confidence += 0.2; // Most explicit format
            if (value.text && value.text.length > 0) confidence += 0.05;
            break;
        case 'url':
            confidence += 0.15; // Standard URLs
            if (value.url.includes('https://')) confidence += 0.05;
            break;
        case 'file_link':
            confidence += 0.15; // Explicit file links
            break;
        case 'file_path':
            confidence += 0.1; // Standard file paths
            break;
    }

    // Validate URL/path format
    if ((type === 'url' || type === 'markdown') && 
        /^https?:\/\/[^\s<>)"']+$/.test(value.url)) {
        confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
}
