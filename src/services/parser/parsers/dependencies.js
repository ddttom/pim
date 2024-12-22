import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('DependenciesParser');

const PATTERNS = {
    // Direct dependencies
    after: {
        pattern: /\b(?:after|following)\s+([^,.]+?)(?=\s*[,.]|$)/i,
        type: 'temporal',
        confidence: 0.9
    },
    requires: {
        pattern: /\b(?:requires|needs|depends\s+on)\s+([^,.]+?)(?=\s*[,.]|$)/i,
        type: 'requirement',
        confidence: 0.9
    },
    before: {
        pattern: /\b(?:before|prior\s+to)\s+([^,.]+?)(?=\s*[,.]|$)/i,
        type: 'temporal',
        confidence: 0.85
    },
    blocks: {
        pattern: /\b(?:blocks|blocking)\s+([^,.]+?)(?=\s*[,.]|$)/i,
        type: 'blocker',
        confidence: 0.85
    },

    // Task references
    taskRef: {
        pattern: /\b(?:task|issue|ticket)\s*#?(\d+)\b/i,
        type: 'reference',
        confidence: 0.95
    },
    subtaskOf: {
        pattern: /\b(?:subtask|sub-task|child)\s+of\s+([^,.]+?)(?=\s*[,.]|$)/i,
        type: 'hierarchy',
        confidence: 0.9
    },
    parentTask: {
        pattern: /\b(?:parent|main)\s+task\s*:\s*([^,.]+?)(?=\s*[,.]|$)/i,
        type: 'hierarchy',
        confidence: 0.9
    }
};

// Dependency types and their relationships
const DEPENDENCY_TYPES = {
    after: { inverse: 'before', blocking: true },
    before: { inverse: 'after', blocking: false },
    requires: { inverse: 'blocks', blocking: true },
    blocks: { inverse: 'requires', blocking: true },
    subtaskOf: { inverse: 'parentOf', blocking: true },
    parentOf: { inverse: 'subtaskOf', blocking: false }
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
            
            // Process each pattern type
            for (const [patternName, config] of Object.entries(PATTERNS)) {
                const matches = Array.from(text.matchAll(config.pattern));
                
                for (const match of matches) {
                    const value = match[1].trim();
                    
                    // Skip if dependency reference is invalid
                    if (!this.validateDependency(value)) {
                        logger.debug('Invalid dependency skipped:', { value });
                        continue;
                    }

                    // Calculate confidence
                    const confidence = this.calculateConfidence(
                        match[0],
                        text,
                        config.confidence,
                        value
                    );

                    highestConfidence = Math.max(highestConfidence, confidence);
                    
                    // Build dependency object
                    const dependency = {
                        type: config.type,
                        value,
                        pattern: patternName,
                        blocking: DEPENDENCY_TYPES[patternName]?.blocking || false,
                        confidence
                    };

                    // Add inverse relationship if applicable
                    const inverseType = DEPENDENCY_TYPES[patternName]?.inverse;
                    if (inverseType) {
                        dependency.inverse = {
                            type: inverseType,
                            blocking: DEPENDENCY_TYPES[inverseType]?.blocking || false
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
            
            // Group dependencies by type
            const groupedDeps = this.groupDependencies(dependencies);

            logger.debug('Dependencies parsed:', {
                count: dependencies.length,
                types: Object.keys(groupedDeps)
            });

            return {
                type: 'dependencies',
                value: dependencies,
                metadata: {
                    pattern: dependencies.length > 1 ? 'multiple' : dependencies[0].pattern,
                    confidence: highestConfidence,
                    count: dependencies.length,
                    blocking: dependencies.some(d => d.blocking),
                    types: Object.keys(groupedDeps),
                    groups: groupedDeps
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
        if (value.length < 3 || value.length > 100) {
            return false;
        }
        
        // Must contain meaningful words
        const words = value.split(/\s+/);
        if (words.length === 0 || words.every(w => w.length < 2)) {
            return false;
        }

        // Validate against common words
        const commonWords = new Set(['the', 'a', 'an', 'this', 'that']);
        if (words.every(w => commonWords.has(w.toLowerCase()))) {
            return false;
        }

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

        // Position-based confidence
        const position = fullText.toLowerCase().indexOf(match.toLowerCase());
        if (position === 0) {
            confidence -= 0.05; // Dependencies usually aren't at start
        } else if (position > fullText.length * 0.5) {
            confidence += 0.05;
        }

        // Context-based confidence
        if (/\b(?:must|should|needs?|required)\b/i.test(fullText)) {
            confidence += 0.05; // Strong requirement indicators
        }

        // Task hierarchy relationships
        if (/(subtask|parent|child)\b/i.test(match)) {
            confidence += 0.05;
        }

        return Math.min(1, confidence);
    },

    groupDependencies(dependencies) {
        const groups = {};
        
        for (const dep of dependencies) {
            if (!groups[dep.type]) {
                groups[dep.type] = [];
            }
            groups[dep.type].push({
                value: dep.value,
                blocking: dep.blocking,
                confidence: dep.confidence
            });
        }

        return groups;
    }
};
