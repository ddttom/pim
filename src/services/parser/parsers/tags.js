import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('TagsParser');

const PATTERNS = {
    // Standard hashtags
    hashtag: {
        pattern: /#([a-zA-Z]\w{1,30}(?:-\w+)*)/g,
        confidence: 0.9
    },
    
    // Category tags with +
    category: {
        pattern: /\+([a-zA-Z]\w{1,30}(?:-\w+)*)/g,
        confidence: 0.85
    },
    
    // Topic tags with @
    topic: {
        pattern: /@([a-zA-Z]\w{1,30}(?:-\w+)*)/g,
        confidence: 0.8
    },
    
    // Inline category notation
    inline: {
        pattern: /\[(\w+(?:-\w+)*)\]/g,
        confidence: 0.7
    }
};

// Common tag prefixes to normalize
const TAG_PREFIXES = {
    'feat': 'feature',
    'doc': 'documentation',
    'docs': 'documentation',
    'bug': 'bugfix',
    'fix': 'bugfix',
    'test': 'testing',
    'tests': 'testing',
    'wip': 'in-progress',
    'imp': 'improvement',
    'perf': 'performance'
};

// Tag categories for better organization
const TAG_CATEGORIES = {
    status: ['todo', 'done', 'wip', 'blocked', 'review'],
    type: ['feature', 'bugfix', 'testing', 'documentation'],
    priority: ['critical', 'important', 'trivial'],
    component: ['frontend', 'backend', 'api', 'ui', 'database'],
    platform: ['web', 'mobile', 'desktop', 'ios', 'android']
};

export default {
    name: 'tags',
    
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
            const tags = new Map();
            let highestConfidence = 0;

            // Process each pattern type
            for (const [patternType, config] of Object.entries(PATTERNS)) {
                const matches = Array.from(text.matchAll(config.pattern));
                
                for (const match of matches) {
                    const tag = match[1].toLowerCase();
                    
                    // Skip if invalid tag
                    if (!this.validateTag(tag)) {
                        logger.debug('Invalid tag skipped:', { tag, pattern: patternType });
                        continue;
                    }

                    // Calculate confidence for this tag
                    const confidence = this.calculateTagConfidence(
                        match[0],
                        text,
                        config.confidence,
                        tag
                    );

                    highestConfidence = Math.max(highestConfidence, confidence);

                    // Normalize and categorize tag
                    const normalizedTag = this.normalizeTag(tag);
                    const category = this.categorizeTag(normalizedTag);
                    
                    tags.set(normalizedTag, {
                        original: tag,
                        pattern: patternType,
                        category,
                        confidence
                    });
                }
            }

            if (tags.size === 0) {
                logger.debug('No tags found');
                return null;
            }

            // Convert tags map to structured result
            const categorizedTags = this.structureTags(tags);
            
            logger.debug('Tags parsed:', {
                count: tags.size,
                categories: Object.keys(categorizedTags)
            });

            return {
                type: 'tags',
                value: Array.from(tags.keys()),
                metadata: {
                    pattern: tags.size > 1 ? 'multiple' : Array.from(tags.values())[0].pattern,
                    confidence: highestConfidence,
                    originalMatches: Array.from(tags.values()).map(t => t.original),
                    categorized: categorizedTags,
                    hierarchy: this.buildTagHierarchy(tags)
                }
            };

        } catch (error) {
            logger.error('Error in tags parser:', {
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

    validateTag(tag) {
        // Check length
        if (tag.length < 2 || tag.length > 30) return false;
        
        // Check for valid characters
        if (!/^[a-z]\w*(?:-\w+)*$/.test(tag)) return false;
        
        // Check for consecutive special characters
        if (/--/.test(tag)) return false;
        
        return true;
    },

    calculateTagConfidence(match, fullText, baseConfidence, tag) {
        let confidence = baseConfidence;
        
        // Adjust for tag quality
        if (tag.length > 3) confidence += 0.05;
        if (tag.includes('-')) confidence += 0.05;
        
        // Adjust for known categories
        if (this.categorizeTag(tag)) confidence += 0.1;
        
        // Penalize very short tags
        if (tag.length < 3) confidence -= 0.1;
        
        // Consider position
        const position = fullText.toLowerCase().indexOf(match.toLowerCase());
        if (position === 0) confidence -= 0.05; // Tags usually aren't at start
        if (position > fullText.length * 0.8) confidence += 0.05; // Tags often at end
        
        return Math.min(1, confidence);
    },

    normalizeTag(tag) {
        // Check for known prefixes
        for (const [prefix, normalized] of Object.entries(TAG_PREFIXES)) {
            if (tag === prefix || tag.startsWith(`${prefix}-`)) {
                return tag.replace(prefix, normalized);
            }
        }
        return tag;
    },

    categorizeTag(tag) {
        // Check each category for matching tags
        for (const [category, tags] of Object.entries(TAG_CATEGORIES)) {
            if (tags.includes(tag)) return category;
        }
        
        // Check for category prefixes
        const firstPart = tag.split('-')[0];
        if (TAG_CATEGORIES[firstPart]) return firstPart;
        
        return 'other';
    },

    structureTags(tags) {
        const categorized = {};
        
        for (const [tag, info] of tags) {
            const category = info.category;
            if (!categorized[category]) {
                categorized[category] = [];
            }
            categorized[category].push(tag);
        }
        
        return categorized;
    },

    buildTagHierarchy(tags) {
        const hierarchy = new Map();
        
        for (const tag of tags.keys()) {
            const parts = tag.split('-');
            let current = hierarchy;
            
            for (const part of parts) {
                if (!current.has(part)) {
                    current.set(part, new Map());
                }
                current = current.get(part);
            }
        }
        
        // Convert Map hierarchy to plain object for easier serialization
        return this.mapToObject(hierarchy);
    },

    mapToObject(map) {
        const obj = {};
        for (const [key, value] of map) {
            obj[key] = value instanceof Map ? this.mapToObject(value) : value;
        }
        return obj;
    }
};
