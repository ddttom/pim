import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('SubjectParser');

// Patterns to remove from subject text
const CLEANUP_PATTERNS = [
    // Time/date patterns
    /\b(?:at|on|by)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i,
    /\b(?:on|by)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(?:today|tomorrow|next week|next month)\b/i,
    
    // Project references
    /\b(?:for|under|about)\s+project\s+[a-z0-9-_]+\b/i,
    /\bproject\s*:\s*[a-z0-9-_]+\b/i,
    
    // Priority/status markers
    /\b(?:high|medium|low)\s+priority\b/i,
    /\b(?:urgent|asap)\b/i,
    /\b(?:started|completed|blocked)\b/i,
    
    // Tags and mentions
    /#[a-z]\w+/i,
    /@[a-z]\w+/i,
    
    // Duration/recurrence
    /\b(?:for|lasting)\s+\d+\s+(?:minutes?|hours?)\b/i,
    /\b(?:every|each)\s+(?:day|week|month)\b/i
];

// Words that shouldn't start a subject
const INVALID_STARTS = new Set([
    'the', 'a', 'an', 'this', 'that', 'these', 'those',
    'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'to', 'in', 'on', 'at', 'by', 'for', 'with'
]);

export default {
    name: 'subject',
    
    parse(text) {
        if (!text || typeof text !== 'string') {
            logger.warn('Invalid input:', { text });
            return {
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            };
        }

        try {
            // Start with the full text
            let subject = text;
            let removedParts = [];

            // Remove all known patterns
            for (const pattern of CLEANUP_PATTERNS) {
                const matches = subject.match(pattern);
                if (matches) {
                    removedParts.push(...matches);
                    subject = subject.replace(pattern, ' ');
                }
            }

            // Clean up whitespace
            subject = subject
                .replace(/\s+/g, ' ')
                .trim();

            // Validate subject
            if (!this.validateSubject(subject)) {
                logger.debug('Subject validation failed:', { subject });
                return null;
            }

            // Calculate confidence
            const confidence = this.calculateSubjectConfidence(
                subject,
                text,
                removedParts
            );

            // Extract key terms
            const keyTerms = this.extractKeyTerms(subject);

            logger.debug('Subject parsed:', {
                subject,
                confidence,
                keyTerms,
                removedParts
            });

            return {
                type: 'subject',
                value: {
                    text: subject,
                    keyTerms
                },
                metadata: {
                    confidence,
                    removedParts,
                    originalLength: text.length,
                    subjectLength: subject.length,
                    position: text.indexOf(subject)
                }
            };

        } catch (error) {
            logger.error('Error in subject parser:', {
                error: error.message,
                stack: error.stack,
                input: text
            });
            
            return {
                type: 'error',
                error: 'PARSER_ERROR',
                message: error.message
            };
        }
    },

    validateSubject(subject) {
        // Check minimum length
        if (subject.length < 3) {
            return false;
        }

        // Check if starts with invalid word
        const firstWord = subject.split(/\s+/)[0].toLowerCase();
        if (INVALID_STARTS.has(firstWord)) {
            return false;
        }

        // Check if it's just left with common words
        const words = subject.split(/\s+/).map(w => w.toLowerCase());
        if (words.every(w => INVALID_STARTS.has(w))) {
            return false;
        }

        return true;
    },

    calculateSubjectConfidence(subject, originalText, removedParts) {
        let confidence = 0.5; // Base confidence

        // Length-based confidence
        const lengthRatio = subject.length / originalText.length;
        if (lengthRatio > 0.7) confidence += 0.2;
        else if (lengthRatio > 0.5) confidence += 0.1;
        else if (lengthRatio < 0.2) confidence -= 0.1;

        // Position-based confidence
        const position = originalText.indexOf(subject);
        if (position === 0) confidence += 0.1;
        else if (position < originalText.length * 0.2) confidence += 0.05;

        // Content-based confidence
        const words = subject.split(/\s+/);
        if (words.length >= 3) confidence += 0.1;
        if (words.length >= 5) confidence += 0.1;

        // Pattern removal confidence
        if (removedParts.length > 0) confidence += 0.1;

        return Math.min(1, confidence);
    },

    extractKeyTerms(subject) {
        const words = subject.toLowerCase().split(/\s+/);
        const keyTerms = new Set();

        // Common action verbs in tasks
        const actionVerbs = new Set([
            'create', 'update', 'review', 'complete', 'implement',
            'write', 'design', 'test', 'fix', 'add', 'remove',
            'modify', 'check', 'verify', 'analyze', 'prepare'
        ]);

        // Extract action verbs
        words.forEach(word => {
            if (actionVerbs.has(word)) {
                keyTerms.add(word);
            }
        });

        // Extract potential nouns (capitalized words not at start)
        const tokens = subject.split(/\s+/);
        for (let i = 1; i < tokens.length; i++) {
            if (/^[A-Z][a-z]{2,}/.test(tokens[i])) {
                keyTerms.add(tokens[i].toLowerCase());
            }
        }

        return Array.from(keyTerms);
    }
};
