import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('DependenciesParser');

const PATTERNS = {
    // Direct dependencies
    after: {
        pattern: /\b(?:after|following)\s+([^,.]+?)(?=\s*[,.]|$)/i,
        type: 'after',
        confidence: 0.9
    },
    requires: {
        pattern: /\b(?:requires|needs|depends\s+on)\s+([^,.]+?)(?=\s*[,.]|$)/i,
        type: 'requires',
        confidence: 0.9
    },
    before: {
        pattern: /\b(?:before|prior\s+to)\s+([^,.]+?)(?=\s*[,.]|$)/i,
        type: 'before',
        confidence: 0.85
    },
    blocks: {
        pattern: /\b(?:blocks|blocking)\s+([^,.]+?)(?=\s*[,.]|$)/i,
        type: 'blocks',
        confidence: 0.85
    },
    
    // Reference-based dependencies
    taskRef: {
        pattern: /\b(?:task|issue|ticket)\s*#?(\d+)\b/i,
        type: 'reference',
        confidence: 0.95
    },
    subtaskOf: {
        pattern: /\b(?:subtask|sub-task|child)\s+of\s+([^,.]+?)(?=\s*[,.]|$)/i,
        type: 'subtask',
        confidence: 0.9
    },
    parentTask: {
        pattern: /\b(?:parent|main)\s+task\s*:\s*([^,.]+?)(?=\s*[,.]|$)/i,
        type: 'parent',
        confidence: 0.9
    }
};

// Dependency types and their relationships
const DEPENDENCY_TYPES = {
    after: { inverse: 'before', blocking: true },
    before: { inverse: 'after', blocking: false },
    requires: { inverse: 'blocks', blocking: true },
    blocks: { inverse: 'requires', blocking: true },
    reference: { inverse: null, blocking: false },
    subtask: { inverse: 'parent', blocking: true },
    parent: { inverse: 'subtask', blocking: false }
};

export default {
    name: 'dependencies',
    
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
            const dependencies = [];
            let highestConfidence = 0;

            // Check each pattern
            for (const [patternName, config] of Object.entries(PATTERNS)) {
                const matches = text.matchAll(config.pattern);
                
                for (const match of matches) {
                    const value = match[1].trim();
                    
                    // Skip if dependency reference is invalid
                    if (!this.validateDependency(value)) {
                        logger.debug('Invalid dependency skipped:', { value });
                        continue;
                    }

                    // Calculate confidence for this dependency
                    const confidence = this.calculateConfidence(
                        match[0],
                        text,
                        config.confidence,
                        value
                    );

                    highestConfidence = Math.max(highestConfidence, confidence);

                    const dependency = {
                        type: config.type,
                        value,
                        pattern: patternName,
                        blocking: DEPENDENCY_TYPES[config.type].blocking,
                        confidence
                    };

                    // Add inverse relationship if applicable
                    const inverseType = DEPENDENCY_TYPES[config.type].inverse;
                    if (inverseType) {
                        dependency.inverse = {
                            type: inverseType,
                            blocking: DEPENDENCY_TYPES[inverseType].blocking
                        };
                    }

                    dependencies.push(dependency);
                }
            }

            if (dependencies.length === 0) {
                logger.debug('No dependencies found');
                return null;
            }

            // Sort dependencies by confidence
            dependencies.sort((a, b) => b.confidence - a.confidence);

            logger.debug('Dependencies parsed:', {
                count: dependencies.length,
                types: dependencies.map(d => d.type)
            });

            return {
                type: 'dependencies',
                value: dependencies,
                metadata: {
                    pattern: dependencies.length > 1 ? 'multiple' : dependencies[0].pattern,
                    confidence: highestConfidence,
                    count: dependencies.length,
                    blocking: dependencies.some(d => d.blocking),
                    types: Array.from(new Set(dependencies.map(d => d.type)))
                }
            };

        } catch (error) {
            logger.error('Error in dependencies parser:', {
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

    validateDependency(value) {
        // Task reference validation
        if (/^#?\d+$/.test(value)) {
            return parseInt(value.replace('#', ''), 10) > 0;
        }

        // Text reference validation
        if (value.length < 3) return false;
        if (value.length > 100) return false;
        
        // Must contain meaningful words
        const words = value.split(/\s+/);
        if (words.length === 0) return false;
        if (words.every(w => w.length < 2)) return false;

        return true;
    },

    calculateConfidence(match, fullText, baseConfidence, value) {
        let confidence = baseConfidence;

        // Adjust based on reference format
        if (/^#?\d+$/.test(value)) {
            confidence += 0.1; // Direct task references are more reliable
        }

        // Adjust based on clarity of relationship
        if (/(after|before|requires|blocks)\b/i.test(match)) {
            confidence += 0.05; // Clear temporal/logical relationships
        }

        // Adjust based on position
        const position = fullText.toLowerCase().indexOf(match.toLowerCase());
        if (position === 0) confidence -= 0.05; // Dependencies usually aren't at start
        if (position > fullText.length * 0.5) confidence += 0.05;

        // Adjust for task hierarchy relationships
        if (/(subtask|parent|child)\b/i.test(match)) {
            confidence += 0.05;
        }

        return Math.min(1, confidence);
    }
};
