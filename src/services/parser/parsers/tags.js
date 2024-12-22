import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('TagsParser');

const TAG_PATTERNS = {
    hashtag: /\#([a-zA-Z]\w{1,30})/g,
    category: /\+([a-zA-Z]\w{1,30})/g,
    topic: /\@([a-zA-Z]\w{1,30})/g,
    inline: /\[([a-zA-Z]\w{1,30})\]/g
};

const KNOWN_CATEGORIES = {
    type: ['feature', 'bugfix', 'docs', 'test', 'refactor'],
    status: ['todo', 'in-progress', 'blocked', 'done'],
    priority: ['critical', 'important', 'normal', 'trivial'],
    component: ['frontend', 'backend', 'api', 'database']
};

export const name = 'tags';

export async function parse(text) {
    if (!text || typeof text !== 'string') {
        return {
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        };
    }

    try {
        const allTags = new Set();
        const tagMatches = [];

        for (const [type, pattern] of Object.entries(TAG_PATTERNS)) {
            const matches = Array.from(text.matchAll(pattern));
            for (const match of matches) {
                const tag = normalizeTag(match[1]);
                if (validateTag(tag)) {
                    allTags.add(tag);
                    tagMatches.push({
                        tag,
                        type,
                        match: match[0]
                    });
                }
            }
        }

        if (allTags.size === 0) {
            return null;
        }

        const tags = Array.from(allTags);
        const confidence = calculateConfidence(tagMatches, text);
        const categorized = categorizeKnownTags(tags);
        const hierarchy = buildTagHierarchy(tags);

        return {
            type: 'tags',
            value: tags,
            metadata: {
                pattern: tagMatches.length > 1 ? 'multiple' : tagMatches[0].type,
                confidence,
                matches: tagMatches.map(m => m.match),
                categorized,
                hierarchy
            }
        };

    } catch (error) {
        logger.error('Error in tags parser:', error);
        return {
            type: 'error',
            error: 'PARSER_ERROR',
            message: error.message
        };
    }
}

function normalizeTag(tag) {
    return tag.toLowerCase().trim();
}

function validateTag(tag) {
    if (tag.length < 2 || tag.length > 30) return false;
    if (!/^[a-z][a-z0-9_-]*$/i.test(tag)) return false;
    return true;
}

function categorizeKnownTags(tags) {
    const categorized = {};
    for (const [category, knownTags] of Object.entries(KNOWN_CATEGORIES)) {
        const matched = tags.filter(tag => knownTags.includes(tag));
        if (matched.length > 0) {
            categorized[category] = matched;
        }
    }
    return categorized;
}

function buildTagHierarchy(tags) {
    const hierarchy = {};
    for (const tag of tags) {
        const parts = tag.split('-');
        let current = hierarchy;
        for (const part of parts) {
            current[part] = current[part] || {};
            current = current[part];
        }
    }
    return hierarchy;
}

function calculateConfidence(matches, text) {
    let confidence = 0.7;

    // Tag count confidence
    confidence += Math.min(matches.length * 0.05, 0.2);

    // Tag variety confidence
    const types = new Set(matches.map(m => m.type));
    confidence += types.size * 0.05;

    // Position confidence
    const hasStartTag = matches.some(m => m.match.index === 0);
    if (hasStartTag) confidence += 0.1;

    return Math.min(confidence, 1.0);
}
