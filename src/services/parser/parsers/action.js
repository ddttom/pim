import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('ActionParser');

const PATTERNS = {
    // Communication actions
    communication: {
        pattern: /\b(call|email|message|contact|notify|inform)\b/i,
        type: 'communication',
        confidence: 0.9,
        requires: ['recipient']
    },
    
    // Meeting actions
    meeting: {
        pattern: /\b(meet|discuss|review|sync|catch[- ]up)\b/i,
        type: 'meeting',
        confidence: 0.85,
        requires: ['time']
    },
    
    // Task actions
    task: {
        pattern: /\b(create|update|complete|finish|implement|fix|add|remove|change)\b/i,
        type: 'task',
        confidence: 0.85,
        requires: ['subject']
    },
    
    // Review actions
    review: {
        pattern: /\b(review|check|verify|validate|assess|evaluate)\b/i,
        type: 'review',
        confidence: 0.8,
        requires: ['subject']
    },
    
    // Schedule actions
    schedule: {
        pattern: /\b(schedule|plan|arrange|book|organize|set[- ]up)\b/i,
        type: 'schedule',
        confidence: 0.85,
        requires: ['time']
    }
};

// Action requirements for validation
const ACTION_REQUIREMENTS = {
    communication: {
        required: ['recipient'],
        optional: ['time', 'subject']
    },
    meeting: {
        required: ['time'],
        optional: ['attendees', 'location']
    },
    task: {
        required: ['subject'],
        optional: ['deadline', 'assignee']
    },
    review: {
        required: ['subject'],
        optional: ['deadline', 'reviewer']
    },
    schedule: {
        required: ['time'],
        optional: ['duration', 'participants']
    }
};

// Action types and their priorities
const ACTION_PRIORITIES = {
    communication: 2,
    meeting: 3,
    task: 1,
    review: 2,
    schedule: 2
};

export default {
    name: 'action',
    
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
            let bestMatch = null;
            let highestConfidence = 0;

            // Process each pattern type
            for (const [patternName, config] of Object.entries(PATTERNS)) {
                const match = text.match(config.pattern);
                
                if (validatePatternMatch(match)) {
                    const verb = match[1].toLowerCase();
                    
                    // Calculate confidence
                    const confidence = this.calculateConfidence(
                        match[0],
                        text,
                        config.confidence,
                        config.type
                    );

                    // Check if this is the best match so far
                    if (confidence > highestConfidence) {
                        // Validate requirements before accepting
                        const requirements = this.checkRequirements(config.type, text);
                        if (requirements.satisfied) {
                            highestConfidence = confidence;
                            bestMatch = {
                                verb,
                                type: config.type,
                                pattern: patternName,
                                confidence,
                                requirements: requirements.found,
                                priority: ACTION_PRIORITIES[config.type] || 1
                            };
                        }
                    }
                }
            }

            if (!bestMatch) {
                logger.debug('No valid action found');
                return null;
            }

            // Find additional context
            const context = this.findActionContext(text, bestMatch);

            logger.debug('Action parsed:', {
                verb: bestMatch.verb,
                type: bestMatch.type,
                confidence: bestMatch.confidence
            });

            return {
                type: 'action',
                value: {
                    verb: bestMatch.verb,
                    type: bestMatch.type,
                    priority: bestMatch.priority
                },
                metadata: {
                    pattern: bestMatch.pattern,
                    confidence: bestMatch.confidence,
                    requirements: bestMatch.requirements,
                    context,
                    isUrgent: this.isUrgentAction(text),
                    hasDeadline: context.deadline !== null,
                    hasDependencies: context.dependencies.length > 0
                }
            };

        } catch (error) {
            logger.error('Error in action parser:', {
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

    calculateConfidence(match, fullText, baseConfidence, actionType) {
        let confidence = baseConfidence;

        // Position-based adjustments
        const position = fullText.toLowerCase().indexOf(match.toLowerCase());
        if (position === 0) {
            confidence += 0.1; // Actions often start the sentence
        }

        // Requirements-based adjustments
        const requirements = this.checkRequirements(actionType, fullText);
        if (requirements.satisfied) {
            confidence += 0.1;
        }

        // Context-based adjustments
        if (this.isUrgentAction(fullText)) {
            confidence += 0.05;
        }

        // Urgency indicators
        if (/\b(?:urgent|asap|immediately)\b/i.test(fullText)) {
            confidence += 0.05;
        }

        // Time specification
        if (/\b(?:today|tomorrow|next|at|on)\b/i.test(fullText)) {
            confidence += 0.05;
        }

        return Math.min(1, confidence);
    },

    checkRequirements(actionType, text) {
        const requirements = ACTION_REQUIREMENTS[actionType];
        if (!requirements) return { satisfied: true, found: [] };

        const found = [];
        let satisfied = true;

        // Check required elements
        for (const req of requirements.required) {
            const hasRequirement = this.checkRequirement(req, text);
            if (hasRequirement) {
                found.push(req);
            } else {
                satisfied = false;
            }
        }

        // Check optional elements
        for (const req of requirements.optional) {
            if (this.checkRequirement(req, text)) {
                found.push(req);
            }
        }

        return { satisfied, found };
    },

    checkRequirement(requirement, text) {
        switch (requirement) {
            case 'recipient':
                return /\b(?:with|to)\s+[A-Z][a-z]+\b|\b@[a-z]\w+\b/i.test(text);
            case 'time':
                return /\b(?:at|on|by)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b|\b(?:today|tomorrow|next)\b/i.test(text);
            case 'subject':
                return /\b(?:about|regarding|re:|on)\s+\w+/i.test(text);
            case 'deadline':
                return /\b(?:by|before|due)\s+\w+/i.test(text);
            case 'location':
                return /\b(?:at|in|room)\s+\w+/i.test(text);
            default:
                return false;
        }
    },

    findActionContext(text, action) {
        return {
            time: this.extractTime(text),
            location: this.extractLocation(text),
            participants: this.extractParticipants(text),
            deadline: this.extractDeadline(text),
            dependencies: this.extractDependencies(text)
        };
    },

    extractTime(text) {
        const timeMatch = text.match(/\b(?:at|on)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
        return timeMatch ? timeMatch[1] : null;
    },

    extractLocation(text) {
        const locationMatch = text.match(/\b(?:at|in|room)\s+([A-Za-z0-9-]+(?:\s+[A-Za-z0-9-]+)*)\b/i);
        return locationMatch ? locationMatch[1] : null;
    },

    extractParticipants(text) {
        const participants = [];
        const matches = text.matchAll(/\b(?:with|and)\s+([A-Z][a-z]+)\b|\b@([a-z]\w+)\b/gi);
        for (const match of matches) {
            participants.push(match[1] || match[2]);
        }
        return participants;
    },

    extractDeadline(text) {
        const deadlineMatch = text.match(/\b(?:by|before|due)\s+([^,.]+)/i);
        return deadlineMatch ? deadlineMatch[1] : null;
    },

    extractDependencies(text) {
        const dependencies = [];
        const matches = text.matchAll(/\b(?:after|before|depends on)\s+([^,.]+)/gi);
        for (const match of matches) {
            dependencies.push(match[1].trim());
        }
        return dependencies;
    },

    isUrgentAction(text) {
        return /\b(?:urgent|asap|immediately|right away)\b/i.test(text);
    }
};
