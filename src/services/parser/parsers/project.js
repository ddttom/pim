import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('ProjectParser');

const PROJECT_PATTERNS = {
    explicit: /\bproject:\s*([A-Z][a-zA-Z0-9_-]+)/i,
    reference: /\b(?:re|about):\s*Project\s+([A-Z][a-zA-Z0-9_-]+)/i,
    identifier: /\b(?:PRJ|PROJ)-(\d+)\b/i,
    shorthand: /\$([A-Z][a-zA-Z0-9_-]+)/i,
    contextual: /\b(?:for|under)\s+project\s+([A-Z][a-zA-Z0-9_-]+)/i
};

const IGNORED_TERMS = new Set(['the', 'this', 'new', 'project']);

export const name = 'project';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    try {
        for (const [type, pattern] of Object.entries(PROJECT_PATTERNS)) {
            const matches = text.match(pattern);
            if (matches) {
                const value = await extractValue(matches);
                if (value && validateProjectName(value)) {
                    const confidence = calculateConfidence(matches, text, type);
                    const indicators = getProjectIndicators(text);

                    return {
                        type: 'project',
                        value: {
                            project: value,
                            originalName: matches[1]
                        },
                        metadata: {
                            pattern: type,
                            confidence,
                            originalMatch: matches[0],
                            indicators
                        }
                    };
                }
            }
        }

        return null;
    } catch (error) {
        logger.error('Error in project parser:', error);
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}

function validateProjectName(name) {
    if (name.length < 2 || name.length > 50) return false;
    if (IGNORED_TERMS.has(name.toLowerCase())) return false;
    return /^[A-Za-z0-9_-]+$/.test(name);
}

function getProjectIndicators(text) {
    const indicators = [];
    if (/\b(?:milestone|epic|sprint)\b/i.test(text)) indicators.push('project_term');
    if (/\b(?:task|story|issue)\b/i.test(text)) indicators.push('task_organization');
    if (/\b(?:client|stakeholder|team)\b/i.test(text)) indicators.push('stakeholder');
    if (/\b(?:roadmap|timeline|schedule)\b/i.test(text)) indicators.push('timeline');
    return indicators;
}

function calculateConfidence(matches, text, type) {
    let confidence = 0.7;

    // Pattern-based confidence
    switch (type) {
        case 'explicit': confidence += 0.2; break;
        case 'identifier': confidence += 0.2; break;
        case 'shorthand': confidence += 0.15; break;
        case 'reference': confidence += 0.1; break;
    }

    // Position-based confidence
    if (matches.index === 0) confidence += 0.1;

    // Format-based confidence
    if (/^[A-Z]/.test(matches[1])) confidence += 0.1;
    if (matches[1].includes('-') || matches[1].includes('_')) confidence += 0.05;

    return Math.min(confidence, 1.0);
}
