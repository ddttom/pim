import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('SubjectParser');

const CLEANUP_PATTERNS = [
    // Remove time references
    /\b(?:at|from|until)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i,
    // Remove date references
    /\b(?:on|by|before|after)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)\b/i,
    // Remove project references
    /\b(?:for|under|in)\s+project\s+[a-z0-9_-]+\b/i,
    // Remove priority markers
    /\b(?:high|medium|low)\s+priority\b/i,
    // Remove tags and mentions
    /[#@]\w+/g
];

const INVALID_START_WORDS = new Set([
    'the', 'a', 'an', 'to', 'in', 'on', 'at', 'by', 'for'
]);

export const name = 'subject';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    try {
        // Clean up text
        const cleanedText = cleanText(text);
        if (!validateSubject(cleanedText)) {
            return null;
        }

        const keyTerms = extractKeyTerms(cleanedText);
        const confidence = calculateConfidence(cleanedText, text);

        return {
            type: 'subject',
            value: {
                text: cleanedText,
                keyTerms
            },
            metadata: {
                confidence,
                originalLength: text.length,
                cleanedLength: cleanedText.length,
                removedParts: getRemovedParts(text, cleanedText),
                hasActionVerb: hasActionVerb(keyTerms)
            }
        };

    } catch (error) {
        logger.error('Error in subject parser:', error);
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}

function cleanText(text) {
    let cleaned = text;
    for (const pattern of CLEANUP_PATTERNS) {
        cleaned = cleaned.replace(pattern, '');
    }
    return cleaned.trim().replace(/\s+/g, ' ');
}

function validateSubject(text) {
    if (text.length < 3) return false;
    const firstWord = text.split(/\s+/)[0].toLowerCase();
    if (INVALID_START_WORDS.has(firstWord)) return false;
    return true;
}

function extractKeyTerms(text) {
    return text
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2);
}

function getRemovedParts(original, cleaned) {
    const parts = [];
    for (const pattern of CLEANUP_PATTERNS) {
        const matches = original.match(pattern);
        if (matches) {
            parts.push(...matches);
        }
    }
    return parts;
}

function hasActionVerb(terms) {
    const actionVerbs = new Set([
        'create', 'update', 'delete', 'fix', 'implement',
        'add', 'remove', 'change', 'modify', 'review'
    ]);
    return terms.some(term => actionVerbs.has(term));
}

function calculateConfidence(cleaned, original) {
    let confidence = 0.7;

    // Length-based confidence
    if (cleaned.length > 10) confidence += 0.1;
    if (cleaned.length > 20) confidence += 0.1;

    // Structure-based confidence
    if (hasActionVerb(extractKeyTerms(cleaned))) confidence += 0.1;
    if (cleaned.split(/\s+/).length >= 3) confidence += 0.1;

    // Context-based confidence
    const removedParts = getRemovedParts(original, cleaned);
    if (removedParts.length > 0) confidence += 0.1;

    return Math.min(confidence, 1.0);
}
