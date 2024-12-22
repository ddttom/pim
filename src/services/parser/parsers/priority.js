import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('PriorityParser');

const PATTERNS = {
    // Explicit priority statements
    explicit: {
        pattern: /\b(?:priority|pri|p):\s*(high|medium|normal|low)\b/i,
        confidence: 0.9
    },
    
    // Priority level keywords
    level: {
        pattern: /\b(high|medium|normal|low)\s+priority\b/i,
        confidence: 0.8
    },
    
    // Urgency indicators
    urgency: {
        pattern: /\b(?:urgent|asap|right away|immediately)\b/i,
        confidence: 0.8
    },
    
    // Shorthand notation
    shorthand: {
        pattern: /\b(?:p0|p1|p2|p3)\b/i,
        confidence: 0.85
    },
    
    // Time pressure indicators
    timePressure: {
        pattern: /\b(?:by eod|by end of day|by tomorrow|by today)\b/i,
        confidence: 0.7
    }
};

// Priority level normalization
const PRIORITY_LEVELS = {
    high: ['high', 'urgent', 'asap', 'p0', 'p1'],
    medium: ['medium', 'normal', 'p2'],
    low: ['low', 'p3', 'whenever', 'eventually']
};

export default {
    name: 'priority',
    
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
            // Check each pattern type
            for (const [patternName, config] of Object.entries(PATTERNS)) {
                const match = text.match(config.pattern);
                
                if (validatePatternMatch(match)) {
                    const value = this.normalizePriority(match[1]?.toLowerCase());
                    
                    // If we can't normalize the priority, skip this match
                    if (!value) continue;

                    // Calculate confidence and collect indicators
                    const confidence = this.calculateConfidence(
                        match[0],
                        text,
                        config.confidence,
                        value
                    );

                    const indicators = this.findPriorityIndicators(text);

                    logger.debug('Priority match found:', {
                        pattern: patternName,
                        value,
                        confidence,
                        indicators
                    });

                    return {
                        type: 'priority',
                        value,
                        metadata: {
                            pattern: patternName,
                            confidence,
                            originalMatch: match[0],
                            indicators
                        }
                    };
                }
            }

            // Check for context-based priority
            const contextualPriority = this.assessContextualPriority(text);
            if (contextualPriority) {
                return {
                    type: 'priority',
                    value: contextualPriority.value,
                    metadata: {
                        pattern: 'contextual',
                        confidence: contextualPriority.confidence,
                        indicators: contextualPriority.indicators
                    }
                };
            }

            logger.debug('No priority pattern matches found');
            return null;

        } catch (error) {
            logger.error('Error in priority parser:', {
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

    normalizePriority(value) {
        if (!value) return null;
        
        // Check each priority level
        for (const [level, variants] of Object.entries(PRIORITY_LEVELS)) {
            if (variants.includes(value.toLowerCase())) {
                return level;
            }
        }

        // Handle shorthand notation
        if (value.startsWith('p')) {
            const num = parseInt(value.substring(1));
            if (num === 0 || num === 1) return 'high';
            if (num === 2) return 'medium';
            if (num === 3) return 'low';
        }

        return null;
    },

    calculateConfidence(match, fullText, baseConfidence, priority) {
        let confidence = baseConfidence;

        // Adjust based on explicit markers
        if (/priority:/i.test(match)) confidence += 0.1;
        
        // Consider position in text
        const position = fullText.toLowerCase().indexOf(match.toLowerCase());
        if (position === 0) confidence += 0.05;
        
        // Adjust for multiple indicators
        const indicators = this.findPriorityIndicators(fullText);
        confidence += Math.min(0.1, indicators.length * 0.02);

        // Adjust based on priority level
        if (priority === 'high') confidence += 0.05;

        return Math.min(1, confidence);
    },

    findPriorityIndicators(text) {
        const indicators = [];
        const lowercaseText = text.toLowerCase();

        // Time pressure
        if (/\b(?:urgent|asap|immediately)\b/i.test(text)) {
            indicators.push('time_pressure');
        }

        // Stakeholder impact
        if (/\b(?:client|customer|boss)\b/i.test(text)) {
            indicators.push('stakeholder');
        }

        // Blocker/dependency
        if (/\b(?:blocking|blocked|depends)\b/i.test(text)) {
            indicators.push('dependency');
        }

        // Impact scope
        if (/\b(?:all|everyone|team)\b/i.test(text)) {
            indicators.push('impact');
        }

        return indicators;
    },

    assessContextualPriority(text) {
        const indicators = this.findPriorityIndicators(text);
        
        if (indicators.length === 0) return null;

        // Calculate contextual priority
        if (indicators.includes('time_pressure') && indicators.includes('stakeholder')) {
            return {
                value: 'high',
                confidence: 0.7,
                indicators
            };
        }

        if (indicators.includes('dependency') || indicators.includes('impact')) {
            return {
                value: 'medium',
                confidence: 0.6,
                indicators
            };
        }

        return null;
    }
};
