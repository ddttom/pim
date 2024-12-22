import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('StatusParser');

const PATTERNS = {
    // Explicit status
    explicit: {
        pattern: /\b(?:status|state)\s*:\s*([a-z][a-z0-9\s-]*[a-z0-9])/i,
        confidence: 0.95
    },
    
    // Progress indicators
    progress: {
        pattern: /\b(\d{1,3})%\s*(?:complete|done|finished)\b/i,
        confidence: 0.9
    },
    
    // Status keywords
    started: {
        pattern: /\b(?:started|begun|in\s+progress|working\s+on)\b/i,
        value: 'started',
        confidence: 0.85
    },
    completed: {
        pattern: /\b(?:completed|done|finished|resolved)\b/i,
        value: 'completed',
        confidence: 0.85
    },
    blocked: {
        pattern: /\b(?:blocked|stuck|waiting|on\s+hold)\b/i,
        value: 'blocked',
        confidence: 0.85
    },
    pending: {
        pattern: /\b(?:pending|not\s+started|todo|to\s+do)\b/i,
        value: 'pending',
        confidence: 0.8
    },
    cancelled: {
        pattern: /\b(?:cancelled|canceled|abandoned|dropped)\b/i,
        value: 'cancelled',
        confidence: 0.85
    }
};

// Valid status transitions
const STATUS_TRANSITIONS = {
    pending: ['started', 'cancelled'],
    started: ['completed', 'blocked', 'cancelled'],
    blocked: ['started', 'cancelled'],
    completed: ['started'], // Can be reopened
    cancelled: ['pending'] // Can be reactivated
};

// Status categories for organization
const STATUS_CATEGORIES = {
    active: ['started', 'in_progress'],
    inactive: ['pending', 'blocked'],
    terminal: ['completed', 'cancelled'],
    transition: ['reopened', 'reactivated']
};

export default {
    name: 'status',
    
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
            let status = null;
            let confidence = 0;
            let pattern = '';
            let progressValue = null;

            // Check explicit status first
            const explicitMatch = text.match(PATTERNS.explicit.pattern);
            if (explicitMatch) {
                const rawStatus = explicitMatch[1].trim().toLowerCase();
                if (this.validateStatus(rawStatus)) {
                    status = this.normalizeStatus(rawStatus);
                    confidence = PATTERNS.explicit.confidence;
                    pattern = 'explicit';
                }
            }

            // Check progress indicator
            const progressMatch = text.match(PATTERNS.progress.pattern);
            if (progressMatch) {
                progressValue = parseInt(progressMatch[1], 10);
                if (progressValue === 100 && (!status || confidence < PATTERNS.progress.confidence)) {
                    status = 'completed';
                    confidence = PATTERNS.progress.confidence;
                    pattern = 'progress';
                }
            }

            // Check other status patterns if no explicit match
            if (!status) {
                for (const [patternName, config] of Object.entries(PATTERNS)) {
                    if (patternName === 'explicit' || patternName === 'progress') continue;

                    const match = text.match(config.pattern);
                    if (match) {
                        status = config.value;
                        pattern = patternName;
                        confidence = this.calculateConfidence(
                            match[0],
                            text,
                            config.confidence,
                            status
                        );
                        break;
                    }
                }
            }

            if (!status) {
                logger.debug('No status found');
                return null;
            }

            // Get status metadata
            const category = this.getStatusCategory(status);
            const transitions = STATUS_TRANSITIONS[status] || [];

            logger.debug('Status parsed:', {
                status,
                confidence,
                pattern,
                category
            });

            return {
                type: 'status',
                value: status,
                metadata: {
                    pattern,
                    confidence,
                    category,
                    progress: progressValue,
                    allowedTransitions: transitions,
                    explicit: pattern === 'explicit',
                    originalMatch: text.match(PATTERNS[pattern].pattern)[0]
                }
            };

        } catch (error) {
            logger.error('Error in status parser:', {
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

    validateStatus(status) {
        // Basic validation
        if (status.length < 2 || status.length > 30) return false;
        if (!/^[a-z][a-z0-9\s-]*[a-z0-9]$/.test(status)) return false;
        
        // Check for known statuses (including normalized forms)
        const normalized = this.normalizeStatus(status);
        return Object.values(STATUS_TRANSITIONS).flat().includes(normalized);
    },

    normalizeStatus(status) {
        // Convert to snake_case and normalize common variations
        status = status.toLowerCase()
            .replace(/\s+/g, '_')
            .replace(/-/g, '_');

        const normalizations = {
            'in_progress': 'started',
            'done': 'completed',
            'finish': 'completed',
            'complete': 'completed',
            'on_hold': 'blocked',
            'to_do': 'pending',
            'todo': 'pending',
            'not_started': 'pending',
            'stuck': 'blocked',
            'waiting': 'blocked',
            'abandoned': 'cancelled',
            'dropped': 'cancelled'
        };

        return normalizations[status] || status;
    },

    calculateConfidence(match, fullText, baseConfidence, status) {
        let confidence = baseConfidence;

        // Adjust based on status clarity
        if (status === 'completed' || status === 'cancelled') {
            confidence += 0.05; // Terminal states are usually clear
        }
        
        // Adjust based on surrounding context
        const context = this.extractStatusContext(fullText, match[0]);
        if (context.supportingTerms.length > 0) {
            confidence += 0.05 * Math.min(context.supportingTerms.length, 2);
        }

        // Consider position in text
        const position = fullText.toLowerCase().indexOf(match[0].toLowerCase());
        const isAtEnd = position > fullText.length * 0.7;
        if (isAtEnd) confidence += 0.05; // Status often specified at end

        // Adjust for progress indicators
        const hasProgress = PATTERNS.progress.pattern.test(fullText);
        if (hasProgress) confidence += 0.05;

        return Math.min(1, confidence);
    },

    extractStatusContext(text, statusMatch) {
        const contextWindow = 50; // Characters to check before/after match
        const matchIndex = text.indexOf(statusMatch);
        const start = Math.max(0, matchIndex - contextWindow);
        const end = Math.min(text.length, matchIndex + statusMatch.length + contextWindow);
        const context = text.slice(start, end).toLowerCase();

        // Look for supporting terms
        const supportingTerms = [];
        
        // Progress indicators
        if (/\d+%/.test(context)) {
            supportingTerms.push('percentage');
        }

        // Time references
        if (/\b(?:today|now|just|recently)\b/.test(context)) {
            supportingTerms.push('temporal');
        }

        // Action words
        if (/\b(?:marked|set|moved|changed|updated)\b/.test(context)) {
            supportingTerms.push('action');
        }

        return {
            context,
            supportingTerms,
            hasTimeReference: supportingTerms.includes('temporal'),
            hasProgressIndicator: supportingTerms.includes('percentage')
        };
    },

    getStatusCategory(status) {
        for (const [category, statuses] of Object.entries(STATUS_CATEGORIES)) {
            if (statuses.includes(status)) {
                return category;
            }
        }
        return 'unknown';
    },

    isTransitionAllowed(fromStatus, toStatus) {
        const allowedTransitions = STATUS_TRANSITIONS[fromStatus] || [];
        return allowedTransitions.includes(toStatus);
    },

    getAvailableTransitions(currentStatus) {
        return STATUS_TRANSITIONS[currentStatus] || [];
    }
};
