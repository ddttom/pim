import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('DependenciesParser');

const DEPENDENCY_PATTERNS = {
    explicit: /\b(?:requires|depends on|blocked by|references?):\s*([^:\n]+)(?:\n|$)/i,
    relationship: /\b(?:blocks|depends on|requires|references)\s+\[task:([^\]]+)\]/i,
    multiple: /\bafter\s+\[task:([^\]]+)\]\s+(?:and|,)\s+\[task:([^\]]+)\]/i,
    implicit: /\b(?:after|before|with)\s+task\s+([a-z0-9_-]+)\b/i
};

const RELATIONSHIP_TYPES = {
    'requires': 'requires',
    'depends on': 'depends_on',
    'blocked by': 'blocked_by',
    'blocks': 'blocks',
    'references': 'references',
    'after': 'after',
    'before': 'before',
    'with': 'with'
};

export const name = 'dependencies';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Invalid input: text must be a non-empty string');
    }

    try {
        for (const [type, pattern] of Object.entries(DEPENDENCY_PATTERNS)) {
            const matches = text.match(pattern);
            if (matches) {
                const value = await extractDependencyValue(matches, type);
                if (value) {
                    const baseConfidence = calculateBaseConfidence(matches, text);
                    const confidence = adjustConfidence(baseConfidence, type, value);
                    return {
                        type: 'dependency',
                        value,
                        metadata: {
                            pattern: type,
                            confidence,
                            originalMatch: matches[0]
                        }
                    };
                }
            }
        }

        return null;
    } catch (error) {
        logger.error('Error in dependencies parser:', error);
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}

async function extractDependencyValue(matches, type) {
    try {
        switch (type) {
            case 'explicit': {
                const relationship = matches[0].toLowerCase().match(/^(\w+(?:\s+\w+)?)/)[1];
                return {
                    type: 'task',
                    relationship: RELATIONSHIP_TYPES[relationship] || 'depends_on',
                    id: matches[1].trim()
                };
            }

            case 'relationship': {
                const relationship = matches[0].toLowerCase().match(/^(\w+(?:\s+\w+)?)/)[1];
                return {
                    type: 'task',
                    relationship: RELATIONSHIP_TYPES[relationship] || 'depends_on',
                    id: matches[1]
                };
            }

            case 'multiple': {
                return {
                    dependencies: [
                        {
                            type: 'task',
                            relationship: 'after',
                            id: matches[1]
                        },
                        {
                            type: 'task',
                            relationship: 'after',
                            id: matches[2]
                        }
                    ]
                };
            }

            case 'implicit': {
                const relationship = matches[0].toLowerCase().match(/^(\w+)/)[1];
                return {
                    type: 'task',
                    relationship: RELATIONSHIP_TYPES[relationship] || 'depends_on',
                    id: matches[1]
                };
            }

            default:
                return null;
        }
    } catch (error) {
        logger.warn('Dependency extraction failed:', { matches, type, error });
        return null;
    }
}

function adjustConfidence(baseConfidence, type, value) {
    let confidence = baseConfidence;

    // Adjust based on pattern type
    switch (type) {
        case 'explicit':
            confidence += 0.2;
            break;
        case 'relationship':
            confidence += 0.15;
            break;
        case 'multiple':
            confidence += value.dependencies?.length > 1 ? 0.15 : 0.1;
            break;
        case 'implicit':
            confidence += 0.05;
            break;
    }

    // Adjust based on value quality
    if (value.id && /^[a-z0-9_-]+$/i.test(value.id)) {
        confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
}
