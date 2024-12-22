import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('ProjectParser');

const PATTERNS = {
    // Explicit project references
    explicit: {
        pattern: /\bProject[:\s]+([a-zA-Z0-9][-_a-zA-Z0-9\s]*[a-zA-Z0-9])/i,
        confidence: 0.9
    },
    
    // Project references with "re:" or "about"
    reference: {
        pattern: /\b(?:re|about):\s*(?:Project\s+)?([a-zA-Z0-9][-_a-zA-Z0-9\s]*[a-zA-Z0-9])/i,
        confidence: 0.8
    },
    
    // Project ID formats
    identifier: {
        pattern: /\b(?:PRJ|PROJ)-(\d+)\b/i,
        confidence: 0.95
    },
    
    // Shorthand notation using $
    shorthand: {
        pattern: /\$([a-zA-Z]\w+)/,
        confidence: 0.85
    },
    
    // For/Under project references
    contextual: {
        pattern: /\b(?:for|under)\s+(?:project\s+)?([a-zA-Z0-9][-_a-zA-Z0-9\s]*[a-zA-Z0-9])/i,
        confidence: 0.7
    }
};

// Words that shouldn't be considered project names alone
const IGNORED_TERMS = new Set([
    'the',
    'this',
    'that',
    'new',
    'current',
    'next',
    'previous',
    'same',
    'other',
    'update',
    'task',
    'meeting'
]);

// Project name validation rules
const VALIDATION_RULES = {
    minLength: 2,
    maxLength: 50,
    validStart: /^[a-zA-Z0-9]/,
    validChars: /^[a-zA-Z0-9\s\-_]+$/
};

export default {
    name: 'project',
    
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
            // Check each pattern in order of confidence
            for (const [key, config] of Object.entries(PATTERNS)) {
                const match = text.match(config.pattern);
                
                if (validatePatternMatch(match)) {
                    const projectName = match[1].trim();
                    
                    // Validate extracted project name
                    const validationResult = this.validateProjectName(projectName);
                    if (!validationResult.isValid) {
                        logger.debug('Project name validation failed:', validationResult);
                        continue;
                    }

                    const confidence = this.calculateConfidence(
                        match[0],
                        text,
                        config.confidence,
                        projectName
                    );

                    logger.debug('Project match found:', {
                        pattern: key,
                        projectName,
                        confidence
                    });

                    return {
                        type: 'project',
                        value: {
                            project: this.formatProjectName(projectName),
                            originalName: projectName
                        },
                        metadata: {
                            pattern: key,
                            confidence,
                            originalMatch: match[0],
                            indicators: this.findProjectIndicators(text)
                        }
                    };
                }
            }

            // Check for project indicators without explicit project reference
            const indicators = this.findProjectIndicators(text);
            if (indicators.length > 0) {
                logger.debug('Found project indicators without project name:', indicators);
            }

            logger.debug('No project pattern matches found');
            return null;

        } catch (error) {
            logger.error('Error in project parser:', {
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

    validateProjectName(name) {
        // Check length constraints
        if (name.length < VALIDATION_RULES.minLength || 
            name.length > VALIDATION_RULES.maxLength) {
            return {
                isValid: false,
                reason: 'length'
            };
        }

        // Check if it's an ignored term
        if (IGNORED_TERMS.has(name.toLowerCase())) {
            return {
                isValid: false,
                reason: 'ignored_term'
            };
        }

        // Check start character
        if (!VALIDATION_RULES.validStart.test(name)) {
            return {
                isValid: false,
                reason: 'invalid_start'
            };
        }

        // Check for valid characters
        if (!VALIDATION_RULES.validChars.test(name)) {
            return {
                isValid: false,
                reason: 'invalid_chars'
            };
        }

        return { isValid: true };
    },

    calculateConfidence(match, fullText, baseConfidence, projectName) {
        let confidence = baseConfidence;
        
        // Adjust based on project name quality
        if (/^[A-Z]/.test(projectName)) confidence += 0.1;
        if (projectName.includes('-') || projectName.includes('_')) confidence += 0.05;
        
        // Adjust based on surrounding context
        const indicators = this.findProjectIndicators(fullText);
        confidence += indicators.length * 0.05;
        
        // Penalize very short project names
        if (projectName.length < 3) confidence -= 0.1;
        
        // Adjust based on position
        const position = fullText.toLowerCase().indexOf(match.toLowerCase());
        if (position === 0) confidence += 0.05;
        
        return Math.min(1, confidence);
    },

    findProjectIndicators(text) {
        const indicators = [];
        const lowercaseText = text.toLowerCase();
        
        // Project-related terms
        if (/\b(?:milestone|phase|sprint|release)\b/i.test(text)) {
            indicators.push('project_term');
        }
        
        // Task organization indicators
        if (/\b(?:task|story|epic|feature)\b/i.test(text)) {
            indicators.push('task_organization');
        }
        
        // Team/stakeholder indicators
        if (/\b(?:team|stakeholder|client|sponsor)\b/i.test(text)) {
            indicators.push('stakeholder');
        }
        
        // Timeline indicators
        if (/\b(?:timeline|roadmap|schedule|plan)\b/i.test(text)) {
            indicators.push('timeline');
        }
        
        return indicators;
    },

    formatProjectName(name) {
        // Ensure consistent formatting of project names
        return name
            // Convert multiple spaces to single space
            .replace(/\s+/g, ' ')
            // Trim hyphens and underscores from ends
            .replace(/^[-_]+|[-_]+$/g, '')
            // Capitalize first letter of each word
            .replace(/\b\w/g, c => c.toUpperCase());
    }
};
