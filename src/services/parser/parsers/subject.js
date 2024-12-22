import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('SubjectParser');

const PATTERNS = {
    // Patterns to remove from subject
    cleanup: {
        time: {
            pattern: /\b(?:at|on|by)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i,
            type: 'remove',
            confidence: 0.9
        },
        date: {
            pattern: /\b(?:on|by)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
            type: 'remove',
            confidence: 0.9
        },
        relative: {
            pattern: /\b(?:today|tomorrow|next week|next month)\b/i,
            type: 'remove',
            confidence: 0.9
        },
        project: {
            pattern: /\b(?:for|under|about)\s+project\s+[a-z0-9-_]+\b/i,
            type: 'remove',
            confidence: 0.9
        },
        priority: {
            pattern: /\b(?:high|medium|low)\s+priority\b/i,
            type: 'remove',
            confidence: 0.9
        },
        urgency: {
            pattern: /\b(?:urgent|asap)\b/i,
            type: 'remove',
            confidence: 0.9
        },
        status: {
            pattern: /\b(?:started|completed|blocked)\b/i,
            type: 'remove',
            confidence: 0.9
        },
        tags: {
            pattern: /#[a-z]\w+/i,
            type: 'remove',
            confidence: 0.9
        },
        mentions: {
            pattern: /@[a-z]\w+/i,
            type: 'remove',
            confidence: 0.9
        }
    },

    // Subject identification patterns
    subject: {
        action: {
            pattern: /^(create|update|review|implement|fix|add|remove|change|test)\b/i,
            type: 'identify',
            confidence: 0.9
        },
        task: {
            pattern: /^(?:need to|must|should|have to)\s+([a-z]+)/i,
            type: 'identify',
            confidence: 0.8
        },
        topic: {
            pattern: /^(?:regarding|re:|about):\s*(.+?)(?=\s*(?:by|on|at|with|#|@|$))/i,
            type: 'identify',
            confidence: 0.85
        }
    }
};

// Words that shouldn't start a subject
const INVALID_STARTS = new Set([
    'the', 'a', 'an', 'this', 'that', 'these', 'those',
    'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'to', 'in', 'on', 'at', 'by', 'for', 'with'
]);

// Common action verbs for better subject understanding
const ACTION_VERBS = new Set([
    'create', 'update', 'review', 'complete', 'implement',
    'write', 'design', 'test', 'fix', 'add', 'remove',
    'modify', 'check', 'verify', 'analyze', 'prepare'
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
            const removedParts = [];
            let highestConfidence = 0;
            let subjectPattern = null;

            // Remove all cleanup patterns
            for (const [patternName, config] of Object.entries(PATTERNS.cleanup)) {
                const matches = subject.match(new RegExp(config.pattern, 'g'));
                if (matches) {
                    removedParts.push(...matches);
                    subject = subject.replace(config.pattern, ' ');
                }
            }

            // Clean up whitespace
            subject = subject.replace(/\s+/g, ' ').trim();

            // Try to identify subject using patterns
            for (const [patternName, config] of Object.entries(PATTERNS.subject)) {
                const match = subject.match(config.pattern);
                if (match) {
                    const confidence = this.calculateConfidence(
                        match[0],
                        text,
                        config.confidence
                    );
                    
                    if (confidence > highestConfidence) {
                        highestConfidence = confidence;
                        subjectPattern = patternName;
                    }
                }
            }

            // Validate subject
            if (!this.validateSubject(subject)) {
                logger.debug('Subject validation failed:', { subject });
                return null;
            }

            // Extract key terms
            const keyTerms = this.extractKeyTerms(subject);

            // Calculate final confidence
            const finalConfidence = this.calculateFinalConfidence(
                subject,
                text,
                highestConfidence,
                keyTerms,
                removedParts
            );

            logger.debug('Subject parsed:', {
                subject,
                confidence: finalConfidence,
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
                    confidence: finalConfidence,
                    pattern: subjectPattern,
                    removedParts,
                    originalLength: text.length,
                    subjectLength: subject.length,
                    position: text.indexOf(subject),
                    hasActionVerb: keyTerms.some(term => ACTION_VERBS.has(term)),
                    complexity: this.assessComplexity(subject)
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

        // Check if it's just common words
        const words = subject.split(/\s+/).map(w => w.toLowerCase());
        if (words.every(w => INVALID_STARTS.has(w))) {
            return false;
        }

        return true;
    },

    extractKeyTerms(subject) {
        const words = subject.toLowerCase().split(/\s+/);
        const keyTerms = new Set();

        // Extract action verbs
        words.forEach(word => {
            if (ACTION_VERBS.has(word)) {
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

        // Extract technical terms
        const techPattern = /(?:[A-Z]{2,}|[A-Z][a-z]+(?:[A-Z][a-z]+)+|\d+(?:\.\d+)+)/g;
        const techMatches = subject.match(techPattern);
        if (techMatches) {
            techMatches.forEach(term => keyTerms.add(term.toLowerCase()));
        }

        return Array.from(keyTerms);
    },

    calculateFinalConfidence(subject, originalText, patternConfidence, keyTerms, removedParts) {
        let confidence = patternConfidence || 0.5;

        // Length-based adjustments
        const lengthRatio = subject.length / originalText.length;
        if (lengthRatio > 0.7) confidence += 0.2;
        else if (lengthRatio > 0.5) confidence += 0.1;
        else if (lengthRatio < 0.2) confidence -= 0.1;

        // Key terms adjustments
        if (keyTerms.length >= 3) confidence += 0.1;
        if (keyTerms.some(term => ACTION_VERBS.has(term))) confidence += 0.1;

        // Position adjustments
        const position = originalText.indexOf(subject);
        if (position === 0) confidence += 0.1;
        
        // Context adjustments
        if (removedParts.length > 0) confidence += 0.1;

        // Structure adjustments
        confidence += this.assessStructure(subject) * 0.1;

        return Math.min(1, confidence);
    },

    assessComplexity(subject) {
        const words = subject.split(/\s+/);
        return {
            wordCount: words.length,
            avgWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
            hasNumbers: /\d+/.test(subject),
            hasTechnicalTerms: /(?:[A-Z]{2,}|\d+(?:\.\d+)+)/.test(subject)
        };
    },

    assessStructure(subject) {
        let score = 0;
        
        // Has action verb at start
        if (ACTION_VERBS.has(subject.split(/\s+/)[0].toLowerCase())) {
            score += 1;
        }

        // Contains object of action
        if (/\b(?:the|a|an)\s+([a-z]+)/i.test(subject)) {
            score += 1;
        }

        // Has additional context
        if (/\b(?:in|on|for|to|with)\s+([a-z]+)/i.test(subject)) {
            score += 1;
        }

        return score;
    }
};
