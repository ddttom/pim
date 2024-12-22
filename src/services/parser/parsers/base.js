/* 
his is the pattern that all parsers follow
standardize the parsers in the project.
to make it easier to understand and maintain.

it's clear that parsers need consistent patterns and error handling.

Consistent Error Handling:

Structured error objects with type and message
Input validation at entry point
Graceful handling of edge cases
Detailed error logging


Improved Pattern Management:

Module-level pattern definitions
Pattern prioritization
Shared patterns across parsers
Pattern-specific confidence scoring


Enhanced Metadata:

Pattern identification
Confidence scoring
*/

import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch } from '../utils/patterns.js';

const logger = createLogger('ParserName');

// Define patterns at module level for performance
const PATTERNS = {
    // Primary patterns
    main: /your-main-pattern-here/i,
    alternative: /alternative-pattern/i,
    
    // Support patterns
    auxiliary: /support-pattern/i
};

export default {
    name: 'parser_name',
    
    parse(text) {
        // Input validation
        if (!text || typeof text !== 'string') {
            logger.warn('Invalid input:', { text });
            return {
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            };
        }

        try {
            // Check each pattern in order of preference
            for (const [patternName, pattern] of Object.entries(PATTERNS)) {
                const match = text.match(pattern);
                
                if (validatePatternMatch(match)) {
                    const value = this.extractValue(match);
                    const confidence = this.calculateConfidence(match[0], text);
                    
                    logger.debug('Pattern match found:', {
                        pattern: patternName,
                        match: match[0],
                        value,
                        confidence
                    });

                    return {
                        type: this.name,
                        value,
                        metadata: {
                            pattern: patternName,
                            confidence,
                            originalMatch: match[0]
                        }
                    };
                }
            }

            logger.debug('No pattern matches found');
            return null;

        } catch (error) {
            logger.error('Parser error:', {
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

    extractValue(match) {
        // Extract and transform the matched value
        return match[1]?.trim();
    },

    calculateConfidence(match, fullText) {
        let confidence = 0.5; // Base confidence
        
        // Common confidence factors:
        // - Pattern specificity
        // - Match position
        // - Supporting context
        // - Quality indicators
        
        return Math.min(1, confidence);
    }
};
