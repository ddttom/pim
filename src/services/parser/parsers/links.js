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

    const patterns = {
        file_link: /\[file:([^\]]+)\]/i,
        markdown: /\[([^\]]+)\]\(([^)]+)\)/i,
        url: /\b((?:https?:\/\/)?(?:[\w-]+\.)+[\w-]+(?:\/[^\s]*)?)/i
    };

    let bestMatch = null;
    let highestConfidence = 0;

    for (const [pattern, regex] of Object.entries(patterns)) {
        const match = text.match(regex);
        if (match) {
            let confidence;
            let value;

            switch (pattern) {
                case 'file_link': {
                    confidence = 0.95;
                    value = {
                        type: 'file',
                        path: match[1].trim()
                    };
                    break;
                }

                case 'markdown': {
                    confidence = 0.95;
                    value = {
                        type: 'markdown',
                        text: match[1],
                        url: match[2]
                    };
                    break;
                }

                case 'url': {
                    confidence = 0.85;
                    const url = match[1];
                    if (url.startsWith('http') || /\.(com|org|net|edu|gov|io)$/i.test(url)) {
                        value = {
                            type: 'url',
                            url: url.startsWith('http') ? url : `https://${url}`
                        };
                    }
                    break;
                }
            }

            if (value && confidence > highestConfidence) {
                highestConfidence = confidence;
                bestMatch = {
                    type: 'link',
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
