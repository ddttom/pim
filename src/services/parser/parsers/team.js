import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('TeamParser');

export const name = 'team';

const VALID_TEAMS = new Set([
    'frontend',
    'backend',
    'design',
    'qa',
    'devops',
    'mobile',
    'infrastructure',
    'security',
    'data',
    'platform'
]);

export function validateTeam(team) {
    if (!team || typeof team !== 'string') return false;
    return VALID_TEAMS.has(team.toLowerCase());
}

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    try {
        // Check for explicit team format
        const explicitMatch = text.match(/\[team:([^\]]+)\]/i);
        if (explicitMatch) {
            const team = explicitMatch[1].trim();
            // Call validateTeam directly to allow error propagation
            const isValid = parse.validateTeam(team);
            if (!isValid) return null;

            return {
                type: 'team',
                value: {
                    team: team.toLowerCase()
                },
                metadata: {
                    pattern: 'explicit',
                    confidence: 0.95,
                    originalMatch: explicitMatch[0]
                }
            };
        }

        // Check for inferred team references
        const inferredMatch = text.match(/\b([a-z0-9_-]+)\s+team\b/i);
        if (inferredMatch) {
            const team = inferredMatch[1];
            // Call validateTeam directly to allow error propagation
            const isValid = parse.validateTeam(team);
            if (!isValid) return null;

            return {
                type: 'team',
                value: {
                    team: team.toLowerCase()
                },
                metadata: {
                    pattern: 'inferred',
                    confidence: 0.80,
                    originalMatch: inferredMatch[0]
                }
            };
        }

        return null;
    } catch (error) {
        logger.error('Error in team parser:', error);
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}

// Make validateTeam available for mocking in tests
parse.validateTeam = validateTeam;
