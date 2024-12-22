import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('ContextsParser');

const PATTERNS = {
    // Work contexts
    work: {
        pattern: /\b(?:client|project|deadline|team|meeting|review|office|work|business|presentation|report)\b/i,
        type: 'work',
        confidence: 0.85,
        indicators: ['professional', 'business']
    },

    // Personal contexts
    personal: {
        pattern: /\b(?:family|home|personal|dinner|grocery|shopping|private|life|hobby)\b/i,
        type: 'personal',
        confidence: 0.85,
        indicators: ['private', 'personal']
    },

    // Health contexts
    health: {
        pattern: /\b(?:doctor|health|medical|appointment|fitness|exercise|gym|wellness|medication)\b/i,
        type: 'health',
        confidence: 0.9,
        indicators: ['wellbeing', 'medical']
    },

    // Social contexts
    social: {
        pattern: /\b(?:team building|social|party|celebration|meetup|gathering|friends|group)\b/i,
        type: 'social',
        confidence: 0.8,
        indicators: ['group', 'social']
    },

    // Shopping contexts
    shopping: {
        pattern: /\b(?:grocery|shopping|store|buy|purchase|market|shop|retail|order)\b/i,
        type: 'shopping',
        confidence: 0.85,
        indicators: ['purchase', 'retail']
    },

    // Location contexts
    location: {
        pattern: /\b(?:at|in|near)\s+(?:the\s+)?(office|home|store|gym|building|room|[A-Z]\d+)\b/i,
        type: 'location',
        confidence: 0.8,
        indicators: ['place', 'location']
    },

    // Time contexts
    timeContext: {
        pattern: /\b(?:during|in)\s+(?:the\s+)?(morning|afternoon|evening|lunch|break|meeting)\b/i,
        type: 'time',
        confidence: 0.8,
        indicators: ['temporal', 'period']
    }
};

// Context relationships and hierarchy
const CONTEXT_RELATIONSHIPS = {
    work: ['meeting', 'project', 'client'],
    personal: ['shopping', 'health', 'social'],
    health: ['fitness', 'medical'],
    shopping: ['grocery', 'retail'],
    location: ['office', 'home', 'store'],
    time: ['morning', 'afternoon', 'evening']
};

export default {
    name: 'contexts',
    
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
            const contexts = new Map();
            let highestConfidence = 0;

            // Process each pattern type
            for (const [patternName, config] of Object.entries(PATTERNS)) {
                const matches = Array.from(text.matchAll(config.pattern));
                
                for (const match of matches) {
                    // Calculate confidence for this context
                    const confidence = this.calculateConfidence(
                        match[0],
                        text,
                        config.confidence,
                        config.type
                    );

                    highestConfidence = Math.max(highestConfidence, confidence);

                    // Find supporting indicators
                    const indicators = this.findContextIndicators(text, config.type);

                    // Create context object
                    contexts.set(config.type, {
                        type: config.type,
                        match: match[0],
                        confidence,
                        indicators,
                        relatedContexts: CONTEXT_RELATIONSHIPS[config.type] || []
                    });

                    // Check for sub-contexts
                    const subContexts = this.findSubContexts(text, config.type);
                    if (subContexts.length > 0) {
                        contexts.get(config.type).subContexts = subContexts;
                    }
                }
            }

            if (contexts.size === 0) {
                logger.debug('No contexts found');
                return null;
            }

            // Build context hierarchy
            const hierarchy = this.buildContextHierarchy(contexts);

            // Group related contexts
            const groupedContexts = this.groupRelatedContexts(contexts);

            logger.debug('Contexts parsed:', {
                count: contexts.size,
                types: Array.from(contexts.keys())
            });

            return {
                type: 'contexts',
                value: Array.from(contexts.values()),
                metadata: {
                    confidence: highestConfidence,
                    count: contexts.size,
                    types: Array.from(contexts.keys()),
                    hierarchy,
                    groups: groupedContexts,
                    primaryContext: this.determinePrimaryContext(contexts)
                }
            };

        } catch (error) {
            logger.error('Error in contexts parser:', {
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

    calculateConfidence(match, fullText, baseConfidence, contextType) {
        let confidence = baseConfidence;

        // Adjust based on explicit markers
        if (/(in|at|during)\s+the\s+/i.test(match)) {
            confidence += 0.1;
        }

        // Consider position in text
        const position = fullText.toLowerCase().indexOf(match.toLowerCase());
        if (position > fullText.length * 0.7) {
            confidence += 0.05;
        }

        // Multiple indicators boost confidence
        const indicators = this.findContextIndicators(fullText, contextType);
        confidence += Math.min(0.1, indicators.length * 0.02);
        
        // Context-specific adjustments
        switch (contextType) {
            case 'work':
                if (/\b(?:meeting|project|client)\b/i.test(fullText)) {
                    confidence += 0.05;
                }
                break;
            case 'personal':
                if (/\b(?:my|home|family)\b/i.test(fullText)) {
                    confidence += 0.05;
                }
                break;
            case 'health':
                if (/\b(?:appointment|doctor)\b/i.test(fullText)) {
                    confidence += 0.05;
                }
                break;
        }

        return Math.min(1, confidence);
    },

    findContextIndicators(text, contextType) {
        const indicators = [];
        const pattern = PATTERNS[contextType];
        
        if (!pattern?.indicators) return indicators;

        pattern.indicators.forEach(indicator => {
            if (new RegExp(`\\b${indicator}\\b`, 'i').test(text)) {
                indicators.push(indicator);
            }
        });

        return indicators;
    },

    findSubContexts(text, parentType) {
        const subContexts = [];
        const relationships = CONTEXT_RELATIONSHIPS[parentType] || [];

        relationships.forEach(subType => {
            if (new RegExp(`\\b${subType}\\b`, 'i').test(text)) {
                subContexts.push({
                    type: subType,
                    parentType
                });
            }
        });

        return subContexts;
    },

    buildContextHierarchy(contexts) {
        const hierarchy = {};
        
        contexts.forEach((context, type) => {
            if (!context.subContexts?.length) return;

            hierarchy[type] = context.subContexts.reduce((acc, sub) => {
                acc[sub.type] = {};
                return acc;
            }, {});
        });

        return hierarchy;
    },

    groupRelatedContexts(contexts) {
        const groups = {};
        
        contexts.forEach((context, type) => {
            const group = this.findContextGroup(type);
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push({
                type,
                confidence: context.confidence,
                indicators: context.indicators
            });
        });

        return groups;
    },

    findContextGroup(type) {
        // Map contexts to high-level groups
        const groupMappings = {
            work: 'professional',
            meeting: 'professional',
            project: 'professional',
            personal: 'private',
            shopping: 'private',
            health: 'wellbeing',
            social: 'private'
        };

        return groupMappings[type] || 'other';
    },

    determinePrimaryContext(contexts) {
        let primaryContext = null;
        let highestConfidence = 0;

        contexts.forEach((context) => {
            if (context.confidence > highestConfidence) {
                highestConfidence = context.confidence;
                primaryContext = context.type;
            }
        });

        return primaryContext;
    }
};
