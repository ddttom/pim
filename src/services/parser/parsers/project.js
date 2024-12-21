import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ProjectParser');

// Define patterns at module level for better performance
const PATTERNS = {
    direct: /\b(?:project|prj)[:\s]+([a-zA-Z0-9][-_a-zA-Z0-9\s]*[a-zA-Z0-9])/i,
    about: /\babout\s+(?:project|prj)[:\s]+([a-zA-Z0-9][-_a-zA-Z0-9\s]*[a-zA-Z0-9])/i,
    re: /\bre:\s*(?:project|prj)[:\s]+([a-zA-Z0-9][-_a-zA-Z0-9\s]*[a-zA-Z0-9])/i,
    identifier: /\b(?:PRJ|PROJ)-\d+\b/i
};

export default {
    name: 'project',
    
    parse(text) {
        // Input validation
        if (!text || typeof text !== 'string') {
            logger.warn('Invalid input to project parser', { text });
            return {
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            };
        }

        try {
            // Try project identifier pattern first
            const idMatch = text.match(PATTERNS.identifier);
            if (idMatch) {
                return {
                    type: 'project',
                    value: idMatch[0].toUpperCase(),
                    metadata: {
                        pattern: 'identifier',
                        confidence: 0.9
                    }
                };
            }

            // Try other patterns
            for (const [patternName, pattern] of Object.entries(PATTERNS)) {
                if (patternName === 'identifier') continue;
                
                const match = pattern.exec(text);
                if (match) {
                    const value = match[1].trim();
                    
                    // Validate extracted value
                    if (value.length < 2 || value.length > 100) {
                        continue; // Try next pattern
                    }

                    // Calculate confidence based on match quality
                    const confidence = this.calculateConfidence(match[0], text);

                    return {
                        type: 'project',
                        value: value,
                        metadata: {
                            pattern: patternName,
                            confidence,
                            originalMatch: match[0]
                        }
                    };
                }
            }

            // No valid matches found
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

    calculateConfidence(match, fullText) {
        let confidence = 0.5; // Base confidence

        // Increase confidence for certain indicators
        if (/\bproject\b/i.test(match)) confidence += 0.2;
        if (/^[A-Z]/.test(match)) confidence += 0.1;
        if (match.length > 10) confidence += 0.1;
        
        // Position-based confidence
        const matchPosition = fullText.indexOf(match);
        if (matchPosition === 0) confidence += 0.1;
        
        return Math.min(1, confidence);
    }
};
