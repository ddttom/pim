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
    /\[priority:(?:high|medium|low)\]/i,
    // Remove tags and mentions
    /[#@]\w+/g,
    // Remove status markers
    /\[status:[^\]]+\]/i,
    /\b(?:is|marked as)\s+(?:pending|started|completed|blocked)\b/i
];

const INVALID_START_WORDS = new Set([
    'the', 'a', 'an', 'to', 'in', 'on', 'at', 'by', 'for'
]);

const ACTION_VERBS = new Set([
    'create', 'update', 'delete', 'fix', 'implement',
    'add', 'remove', 'change', 'modify', 'review',
    'build', 'test', 'deploy', 'merge', 'refactor',
    'debug', 'optimize', 'analyze', 'document', 'configure'
]);

export const name = 'subject';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    try {
        const cleanedText = cleanText(text);
        const removedParts = getRemovedParts(text, cleanedText);
        const keyTerms = extractKeyTerms(cleanedText);
        const hasVerb = hasActionVerb(keyTerms);

        if (!validateSubject(cleanedText)) {
            return null;
        }

        return {
            type: 'subject',
            value: {
                text: cleanedText,
                keyTerms
            },
            metadata: {
                confidence: calculateSubjectConfidence(cleanedText, hasVerb, removedParts),
                hasActionVerb: hasVerb,
                removedParts,
                originalText: text
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
    if (!text || text.length < 3) return false;
    const firstWord = text.split(/\s+/)[0].toLowerCase();
    if (INVALID_START_WORDS.has(firstWord)) return false;
    if (/[\0\x08\x09\x1a\x1b]/.test(text)) return false;
    return true;
}

function extractKeyTerms(text) {
    return text
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2 && !INVALID_START_WORDS.has(word));
}

function getRemovedParts(original, cleaned) {
    const parts = [];
    for (const pattern of CLEANUP_PATTERNS) {
        const matches = original.match(pattern);
        if (matches) {
            parts.push(...matches.map(m => m.trim()));
        }
    }
    return parts.filter(Boolean);
}

function hasActionVerb(terms) {
    return terms.some(term => ACTION_VERBS.has(term));
}

function calculateSubjectConfidence(cleaned, hasVerb, removedParts) {
    let confidence = 0.7; // Base confidence

    // Length-based confidence
    const words = cleaned.split(/\s+/);
    if (words.length >= 3 && words.length <= 10) confidence += 0.1;

    // Structure-based confidence
    if (hasVerb) confidence += 0.1;

    // Context-based confidence
    if (removedParts.length > 0) confidence += 0.05;

    // Quality-based confidence
    if (!INVALID_START_WORDS.has(words[0])) confidence += 0.05;

    return Math.min(confidence, 1.0);
}
