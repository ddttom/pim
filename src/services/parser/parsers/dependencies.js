import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('DependenciesParser');

const PATTERNS = {
    explicit_dependency: /\b(?:requires|depends on|blocked by|references?):\s*([^:\n]+)(?:\n|$)/i,
    relationship_dependency: /\b(blocks|depends\s+on|requires)\s+\[task:([^\]]+)\]/i,
    multiple_dependencies: /\bafter\s+\[task:([^\]]+)\]\s+(?:and|,)\s+\[task:([^\]]+)\]/i,
    implicit_dependency: /\b(after|before|with)\s+task\s+([a-z0-9_-]+)\b/i
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
        for (const [pattern, regex] of Object.entries(PATTERNS)) {
            const match = text.match(regex);
            if (match) {
                let value;
                let confidence = pattern === 'explicit_dependency' ? 0.95 : 0.9;

                switch (pattern) {
                    case 'explicit_dependency': {
                        const relationship = 'depends_on';
                        value = {
                            type: 'task',
                            id: match[1],
                            relationship
                        };
                        break;
                    }

                    case 'relationship_dependency': {
                        const relationship = RELATIONSHIP_TYPES[match[1].toLowerCase()] || match[1].toLowerCase().replace(/\s+/g, '_');
                        value = {
                            type: 'task',
                            id: match[2],
                            relationship
                        };
                        break;
                    }

                    case 'multiple_dependencies': {
                        value = {
                            dependencies: [
                                {
                                    type: 'task',
                                    id: match[1],
                                    relationship: 'after'
                                },
                                {
                                    type: 'task',
                                    id: match[2],
                                    relationship: 'after'
                                }
                            ]
                        };
                        break;
                    }

                    case 'implicit_dependency': {
                        confidence = 0.75;
                        const relationship = RELATIONSHIP_TYPES[match[1].toLowerCase()];
                        value = {
                            type: 'task',
                            id: match[2],
                            relationship
                        };
                        break;
                    }
                }

                return {
                    type: 'dependency',
                    value,
                    metadata: {
                        confidence,
                        pattern,
                        originalMatch: match[0]
                    }
                };
            }
        }
        
        return null;
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
}
