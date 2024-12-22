import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('CategoriesParser');

const PATTERNS = {
    // Standard hashtags
    hashtag: {
        pattern: /#([a-zA-Z]\w{1,30}(?:-\w+)*)/g,
        type: 'tag',
        confidence: 0.9
    },

    // Category prefixes
    prefixed: {
        pattern: /\bcategory:\s*([a-zA-Z]\w{1,30}(?:-\w+)*)/gi,
        type: 'explicit',
        confidence: 0.95
    },

    // In-text categories
    inline: {
        pattern: /\bin\s+(?:the\s+)?(?:category|section)\s+([a-zA-Z]\w{1,30}(?:-\w+)*)/gi,
        type: 'inline',
        confidence: 0.85
    },

    // Group markers
    group: {
        pattern: /\bgroup:\s*([a-zA-Z]\w{1,30}(?:-\w+)*)/gi,
        type: 'group',
        confidence: 0.9
    },

    // Folder structure
    folder: {
        pattern: /\bfolder:\s*([a-zA-Z]\w{1,30}(?:\/\w+)*)/gi,
        type: 'folder',
        confidence: 0.9
    }
};

// Category hierarchy and relationships
const CATEGORY_HIERARCHY = {
    work: ['project', 'meeting', 'task'],
    personal: ['health', 'finance', 'hobby'],
    reference: ['document', 'note', 'template'],
    status: ['active', 'pending', 'completed']
};

// Common category prefixes to normalize
const CATEGORY_PREFIXES = {
    'proj': 'project',
    'doc': 'document',
    'ref': 'reference',
    'temp': 'template',
    'fin': 'finance',
    'act': 'active',
    'comp': 'completed'
};

export default {
    name: 'categories',
    
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
            const categories = new Map();
            let highestConfidence = 0;
            let primaryPattern = null;

            // Process each pattern type
            for (const [patternName, config] of Object.entries(PATTERNS)) {
                const matches = Array.from(text.matchAll(config.pattern));
                
                for (const match of matches) {
                    const value = match[1].trim();
                    
                    // Skip if category is invalid
                    if (!this.validateCategory(value)) {
                        logger.debug('Invalid category skipped:', { value });
                        continue;
                    }

                    // Normalize category name
                    const normalizedValue = this.normalizeCategory(value);

                    // Calculate confidence
                    const confidence = this.calculateConfidence(
                        match[0],
                        text,
                        config.confidence,
                        normalizedValue
                    );

                    if (confidence > highestConfidence) {
                        highestConfidence = confidence;
                        primaryPattern = patternName;
                    }

                    // Get parent categories
                    const parents = this.findParentCategories(normalizedValue);

                    // Add to categories with metadata
                    categories.set(normalizedValue, {
                        original: value,
                        normalized: normalizedValue,
                        type: config.type,
                        pattern: patternName,
                        confidence,
                        parents,
                        path: this.buildCategoryPath(normalizedValue, parents)
                    });
                }
            }

            if (categories.size === 0) {
                logger.debug('No categories found');
                return null;
            }

            // Build category relationships
            const relationships = this.buildRelationships(categories);

            // Build category hierarchy
            const hierarchy = this.buildHierarchy(categories);

            logger.debug('Categories parsed:', {
                count: categories.size,
                types: Array.from(new Set(Array.from(categories.values()).map(c => c.type)))
            });

            return {
                type: 'categories',
                value: Array.from(categories.values()),
                metadata: {
                    pattern: primaryPattern,
                    confidence: highestConfidence,
                    count: categories.size,
                    types: Array.from(new Set(Array.from(categories.values()).map(c => c.type))),
                    hierarchy,
                    relationships,
                    hasExplicit: Array.from(categories.values()).some(c => c.type === 'explicit'),
                    topLevel: this.findTopLevelCategories(categories)
                }
            };

        } catch (error) {
            logger.error('Error in categories parser:', {
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

    validateCategory(value) {
        // Check length
        if (!value || value.length < 2 || value.length > 50) {
            return false;
        }

        // Check format
        if (!/^[a-zA-Z]\w*(?:-\w+)*$/.test(value)) {
            return false;
        }

        // Check for reserved words
        const reservedWords = ['category', 'group', 'folder', 'section'];
        if (reservedWords.includes(value.toLowerCase())) {
            return false;
        }

        return true;
    },

    normalizeCategory(value) {
        // Convert to lowercase
        value = value.toLowerCase();

        // Replace known prefixes
        for (const [prefix, full] of Object.entries(CATEGORY_PREFIXES)) {
            if (value === prefix || value.startsWith(`${prefix}-`)) {
                return value.replace(prefix, full);
            }
        }

        return value;
    },

    calculateConfidence(match, fullText, baseConfidence, category) {
        let confidence = baseConfidence;

        // Adjust based on pattern specificity
        if (match.startsWith('#')) {
            confidence += 0.05; // Explicit hashtag
        }
        if (match.toLowerCase().includes('category:')) {
            confidence += 0.1; // Explicit category marker
        }

        // Consider position in text
        const position = fullText.toLowerCase().indexOf(match.toLowerCase());
        if (position > fullText.length * 0.7) {
            confidence += 0.05;
        }

        // Multiple word categories might be more specific
        if (category.includes('-')) {
            confidence += 0.05;
        }

        // Known category hierarchies
        for (const [parent, children] of Object.entries(CATEGORY_HIERARCHY)) {
            if (children.includes(category)) {
                confidence += 0.05;
                break;
            }
        }

        return Math.min(1, confidence);
    },

    findParentCategories(category) {
        const parents = new Set();

        for (const [parent, children] of Object.entries(CATEGORY_HIERARCHY)) {
            if (children.includes(category)) {
                parents.add(parent);
            }
        }

        return Array.from(parents);
    },

    buildCategoryPath(category, parents) {
        if (parents.length === 0) {
            return category;
        }
        return `${parents[0]}/${category}`;
    },

    buildRelationships(categories) {
        const relationships = {};

        categories.forEach((category, key) => {
            relationships[key] = {
                parents: category.parents,
                siblings: this.findSiblingCategories(key, categories),
                children: this.findChildCategories(key, categories)
            };
        });

        return relationships;
    },

    findSiblingCategories(category, categories) {
        const siblings = new Set();

        // Find categories with same parents
        const targetParents = categories.get(category).parents;
        categories.forEach((cat, key) => {
            if (key !== category && 
                JSON.stringify(cat.parents) === JSON.stringify(targetParents)) {
                siblings.add(key);
            }
        });

        return Array.from(siblings);
    },

    findChildCategories(category, categories) {
        const children = new Set();

        categories.forEach((cat, key) => {
            if (cat.parents.includes(category)) {
                children.add(key);
            }
        });

        return Array.from(children);
    },

    buildHierarchy(categories) {
        const hierarchy = {};

        // Add top-level categories
        categories.forEach((category, key) => {
            if (category.parents.length === 0) {
                hierarchy[key] = this.buildSubHierarchy(key, categories);
            }
        });

        return hierarchy;
    },

    buildSubHierarchy(parent, categories) {
        const subHierarchy = {};
        
        categories.forEach((category, key) => {
            if (category.parents.includes(parent)) {
                subHierarchy[key] = this.buildSubHierarchy(key, categories);
            }
        });

        return subHierarchy;
    },

    findTopLevelCategories(categories) {
        return Array.from(categories.values())
            .filter(category => category.parents.length === 0)
            .map(category => category.normalized);
    }
};
