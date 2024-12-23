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

    const patterns = {
        relationship_dependency: /\b(blocks|depends\s+on|requires)\s+\[task:([^\]]+)\]/i,
        multiple_dependencies: /\bafter\s+\[task:([^\]]+)\]\s+and\s+\[task:([^\]]+)\]/i,
        implicit_dependency: /\b(after|before|with)\s+task\s+([a-z0-9_-]+)\b/i
    };

    let bestMatch = null;
    let highestConfidence = 0;

    for (const [pattern, regex] of Object.entries(patterns)) {
        const match = text.match(regex);
        if (match) {
            let confidence;
            let value;

            switch (pattern) {
                case 'relationship_dependency': {
                    confidence = 0.90;
                    const relationship = match[1].toLowerCase().replace(/\s+/g, '_');
                    value = {
                        type: 'task',
                        id: match[2],
                        relationship
                    };
                    break;
                }

                case 'multiple_dependencies': {
                    confidence = 0.90;
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
                    value = {
                        type: 'task',
                        id: match[2],
                        relationship: match[1].toLowerCase()
                    };
                    break;
                }
            }

            if (confidence > highestConfidence) {
                highestConfidence = confidence;
                bestMatch = {
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
    }

    return bestMatch;
}
