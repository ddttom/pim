import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('AttendeesParser');

const PATTERNS = {
    // Direct mentions
    mentions: {
        pattern: /@([a-zA-Z]\w+)/g,
        type: 'mention',
        confidence: 0.95
    },

    // With phrases
    withPhrase: {
        pattern: /\bwith\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*(?:\s+(?:and|&)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?)/,
        type: 'explicit',
        confidence: 0.9
    },

    // Team references
    team: {
        pattern: /\b(?:team|group|department)\s+([A-Z][a-z]+)/i,
        type: 'team',
        confidence: 0.85
    },

    // Role references
    role: {
        pattern: /\b(?:manager|lead|supervisor|director)\s+([A-Z][a-z]+)/i,
        type: 'role',
        confidence: 0.8
    },

    // Contact phrases
    contact: {
        pattern: /\b(?:contact|email|call|message)\s+([A-Z][a-z]+)/i,
        type: 'contact',
        confidence: 0.8
    }
};

// Words that shouldn't be treated as names
const COMMON_WORDS = new Set([
    'me', 'team', 'everyone', 'anybody', 'someone',
    'manager', 'lead', 'the', 'group', 'all',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday'
]);

// Role mappings for context
const ROLE_TYPES = {
    manager: 'management',
    lead: 'leadership',
    supervisor: 'management',
    director: 'executive',
    coordinator: 'coordination'
};

export default {
    name: 'attendees',
    
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
            const attendees = new Map();
            const participants = new Set();
            let highestConfidence = 0;
            let primaryPattern = null;

            // Handle team mentions first
            if (text.toLowerCase().includes('with the team')) {
                return {
                    type: 'attendees',
                    value: {
                        attendees: ['team'],
                        participants: ['team']
                    },
                    metadata: {
                        pattern: 'team',
                        confidence: 0.8,
                        isGroupMention: true
                    }
                };
            }

            // Process each pattern type
            for (const [patternName, config] of Object.entries(PATTERNS)) {
                const matches = Array.from(text.matchAll(config.pattern));
                
                for (const match of matches) {
                    const names = this.extractNames(match[1]);
                    
                    names.forEach(name => {
                        // Skip invalid names
                        if (!this.validateName(name)) {
                            logger.debug('Invalid name skipped:', { name });
                            continue;
                        }

                        // Calculate confidence
                        const confidence = this.calculateConfidence(
                            match[0],
                            text,
                            config.confidence,
                            name
                        );

                        if (confidence > highestConfidence) {
                            highestConfidence = confidence;
                            primaryPattern = patternName;
                        }

                        // Add to attendees with metadata
                        attendees.set(name, {
                            name,
                            type: config.type,
                            pattern: patternName,
                            confidence,
                            role: this.determineRole(match[0], name),
                            context: this.determineContext(match[0], text)
                        });

                        // Add to participants set (normalized)
                        participants.add(name.toLowerCase());
                    });
                }
            }

            if (attendees.size === 0) {
                logger.debug('No attendees found');
                return null;
            }

            // Group attendees by type
            const groupedAttendees = this.groupAttendees(attendees);

            logger.debug('Attendees parsed:', {
                count: attendees.size,
                types: Object.keys(groupedAttendees)
            });

            return {
                type: 'attendees',
                value: {
                    attendees: Array.from(attendees.values()),
                    participants: Array.from(participants)
                },
                metadata: {
                    pattern: primaryPattern,
                    confidence: highestConfidence,
                    count: attendees.size,
                    types: Object.keys(groupedAttendees),
                    groups: groupedAttendees,
                    hasTeamMention: participants.has('team'),
                    roleTypes: this.extractRoleTypes(attendees)
                }
            };

        } catch (error) {
            logger.error('Error in attendees parser:', {
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

    extractNames(text) {
        if (!text) return [];
        
        // Split by commas and 'and'/'&'
        return text
            .split(/\s*(?:,|\band\b|&)\s*/)
            .map(name => name.trim())
            .filter(name => name.length > 0);
    },

    validateName(name) {
        // Basic name validation
        if (!name || typeof name !== 'string' || name.length < 2) {
            return false;
        }

        // Check if it's a common word
        if (COMMON_WORDS.has(name.toLowerCase())) {
            return false;
        }

        // Check for proper capitalization
        if (!/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(name)) {
            return false;
        }

        return true;
    },

    calculateConfidence(match, fullText, baseConfidence, name) {
        let confidence = baseConfidence;

        // Adjust based on pattern specificity
        if (match.startsWith('@')) {
            confidence += 0.1; // Direct mentions are more reliable
        }

        // Consider position in text
        const position = fullText.toLowerCase().indexOf(match.toLowerCase());
        if (position > fullText.length * 0.7) {
            confidence += 0.05;
        }

        // Context-based adjustments
        if (/\b(?:with|and)\s+/i.test(match)) {
            confidence += 0.05;
        }

        // Role-based adjustments
        const role = this.determineRole(match, name);
        if (role) {
            confidence += 0.05;
        }

        // Multiple word names are more likely to be real names
        if (name.includes(' ')) {
            confidence += 0.05;
        }

        return Math.min(1, confidence);
    },

    determineRole(match, name) {
        for (const [role, type] of Object.entries(ROLE_TYPES)) {
            if (new RegExp(`\\b${role}\\s+${name}\\b`, 'i').test(match)) {
                return { title: role, type };
            }
        }
        return null;
    },

    determineContext(match, fullText) {
        const contexts = [];

        // Meeting context
        if (/\b(?:meeting|call|review)\b/i.test(fullText)) {
            contexts.push('meeting');
        }

        // Project context
        if (/\b(?:project|task|work)\b/i.test(fullText)) {
            contexts.push('project');
        }

        // Social context
        if (/\b(?:lunch|coffee|social)\b/i.test(fullText)) {
            contexts.push('social');
        }

        return contexts.length > 0 ? contexts : null;
    },

    groupAttendees(attendees) {
        const groups = {};
        
        attendees.forEach(attendee => {
            const type = attendee.type || 'other';
            if (!groups[type]) {
                groups[type] = [];
            }
            groups[type].push({
                name: attendee.name,
                confidence: attendee.confidence,
                role: attendee.role
            });
        });

        return groups;
    },

    extractRoleTypes(attendees) {
        const roleTypes = new Set();
        
        attendees.forEach(attendee => {
            if (attendee.role?.type) {
                roleTypes.add(attendee.role.type);
            }
        });

        return Array.from(roleTypes);
    }
};
