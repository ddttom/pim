import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('LocationParser');

const PATTERNS = {
    // Physical locations
    building: /\bin\s+(?:building\s+)?([A-Z][0-9]+|[A-Z]-?[0-9]+)\b/i,
    room: /\b(?:room|rm)\s+([A-Z0-9-]+)\b/i,
    floor: /\bon\s+(?:floor|fl)\s+([A-Z0-9-]+)\b/i,
    suite: /\b(?:suite|ste)\s+([A-Z0-9-]+)\b/i,
    
    // General locations
    at: /\bat\s+([A-Za-z][a-zA-Z0-9\s]+(?:\s+[A-Za-z][a-zA-Z0-9\s]*)*)/i,
    in: /\bin\s+([A-Za-z][a-zA-Z0-9\s]+(?:\s+[A-Za-z][a-zA-Z0-9\s]*)*)/i,
    
    // Virtual locations
    virtual: /\b(?:on|via|using)\s+(zoom|teams|meet|skype|webex)\b/i,
    meetingUrl: /\b(?:https:\/\/)?(?:zoom\.us|meet\.google\.com|teams\.microsoft\.com)\/[^\s]+/i
};

// Common words that shouldn't be treated as locations
const IGNORED_LOCATIONS = new Set([
    'the',
    'a',
    'an',
    'here',
    'there',
    'anywhere',
    'somewhere'
]);

export default {
    name: 'location',
    
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
            // Check physical location patterns first
            for (const [patternName, pattern] of [
                ['building', PATTERNS.building],
                ['room', PATTERNS.room],
                ['floor', PATTERNS.floor],
                ['suite', PATTERNS.suite]
            ]) {
                const match = text.match(pattern);
                if (validatePatternMatch(match)) {
                    const value = match[1].trim();
                    const confidence = this.calculateConfidence(match[0], text);
                    
                    logger.debug('Physical location match:', {
                        type: patternName,
                        value,
                        confidence
                    });

                    return {
                        type: 'location',
                        value: {
                            type: 'physical',
                            [patternName]: value
                        },
                        metadata: {
                            pattern: patternName,
                            confidence,
                            originalMatch: match[0]
                        }
                    };
                }
            }

            // Check virtual meeting patterns
            const virtualMatch = text.match(PATTERNS.virtual);
            const urlMatch = text.match(PATTERNS.meetingUrl);
            
            if (virtualMatch || urlMatch) {
                const platform = virtualMatch ? virtualMatch[1].toLowerCase() : 'unknown';
                const link = urlMatch ? urlMatch[0] : null;
                
                logger.debug('Virtual location match:', { platform, link });
                
                return {
                    type: 'location',
                    value: {
                        type: 'online',
                        value: platform,
                        link
                    },
                    metadata: {
                        pattern: 'virtual',
                        confidence: 0.9,
                        originalMatch: virtualMatch?.[0] || urlMatch[0]
                    }
                };
            }

            // Check general location patterns
            for (const [patternName, pattern] of [
                ['at', PATTERNS.at],
                ['in', PATTERNS.in]
            ]) {
                const match = text.match(pattern);
                if (validatePatternMatch(match)) {
                    const value = match[1].trim();
                    
                    // Skip if location is in ignored list
                    if (IGNORED_LOCATIONS.has(value.toLowerCase())) {
                        continue;
                    }
                    
                    const confidence = this.calculateConfidence(match[0], text);
                    
                    logger.debug('General location match:', {
                        type: 'general',
                        value,
                        confidence
                    });

                    return {
                        type: 'location',
                        value: {
                            type: 'generic',
                            value
                        },
                        metadata: {
                            pattern: patternName,
                            confidence,
                            originalMatch: match[0]
                        }
                    };
                }
            }

            logger.debug('No location pattern matches found');
            return null;

        } catch (error) {
            logger.error('Error in location parser:', {
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
        let confidence = calculateBaseConfidence(match, fullText);
        
        // Location-specific confidence factors
        if (/^(at|in|on)\s+/i.test(match)) confidence += 0.2;
        if (/\b(building|room|floor|suite)\b/i.test(match)) confidence += 0.2;
        if (/\b(zoom|teams|meet)\b/i.test(match)) confidence += 0.2;
        
        // Penalize very short or common locations
        if (match.length < 5) confidence -= 0.1;
        
        return Math.min(1, confidence);
    }
};
