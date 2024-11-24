const { compilePatterns } = require('./utils/patterns');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('NaturalLanguageParser');

class NaturalLanguageParser {
    constructor() {
        this.plugins = new Map();
        this.patterns = new Map();
        
        // Initialize with default patterns
        this.patterns = compilePatterns({
            action: /^(call|email|meet|review|follow up|schedule|book|arrange|organize|plan|prepare|write|draft|create|make|do|check|verify|confirm|send|share|update|modify|change|delete|remove|add|text)/i,
            contact: /@(\w+)|(?:call|email|meet|contact|text|with)\s+(\w+)(?:\s*,\s*|\s+and\s+|\s+|$)/i,
            datetime: /\b(today|tomorrow|next\s+(?:week|month|year)|(?:this|next|last)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b(?:in|after|before)\s+(\d+)\s+(?:day|week|month|year)s?\b/i,
            priority: /\b(urgent|high|medium|low|normal)\b/i,
            category: /#(\w+)/,
            duration: /(?:for|lasting)\s+(\d+)\s+(minutes?|mins?|hours?|hrs?)/i,
            location: /(?:in|at|on)\s+(?:the\s+)?(office|zoom|(?:New York[^,\.]*)|(?:Room\s+\d+))/i,
            complexity: /\b(complex|standard|quick|simple)\s+(?:task|review|work)/i,
            recurring: /\b(?:every|each)\s+(day|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
            timeOfDay: /\b(morning|afternoon|evening)\b|\b(\d{1,2})(?::\d{2})?\s*(?:am|pm)?\b/i,
            reminder: /remind(?:\s+me)?\s+(\d+)\s+(minutes?|mins?|hours?|hrs?|days?)\s+before/i,
            urgency: /\b(asap|urgent|end of day|soon)\b/i,
            subject: /\babout\s+([^,\.]+)|\#(\w+)/i,
            attendees: /\bwith\s+(?:team\s+)?([^,\.]+)(?:\s*,\s*|\s+and\s+|$)/i,
            project: /\bProject\s+([^,\.]+)|\$(\w+)/i,
            status: /(\d+)%\s+complete/i,
            zoom: /https:\/\/zoom\.us\/j\/\d+/i,
            // Add temporal words pattern for sanitization
            temporal: /\b(tomorrow|next|today|later|soon|after|before)\b/i
        });

        this.loadDefaultPlugins();
    }

    loadDefaultPlugins() {
        try {
            const defaultPlugins = [
                require('./parsers/location'),
                require('./parsers/attendees'),
                require('./parsers/project'),
                require('./parsers/reminders'),
                require('./parsers/date'),
                require('./parsers/duration'),
                require('./parsers/complexity'),
                require('./parsers/recurring'),
                require('./parsers/timeOfDay'),
                require('./parsers/subject'),
                require('./parsers/urgency'),
                require('./parsers/status'),
                require('./parsers/contact'),
                require('./parsers/categories'),
                require('./parsers/dependencies'),
                require('./parsers/links')
            ];

            defaultPlugins.forEach(plugin => {
                if (plugin && plugin.name) {
                    this.plugins.set(plugin.name, plugin);
                }
            });

            logger.info('Default plugins loaded:', { count: defaultPlugins.length });
        } catch (error) {
            logger.error('Error loading default plugins:', { error });
        }
    }

    sanitizeInput(text) {
        // Remove temporal words for certain parsers
        return {
            original: text,
            sanitized: text.replace(this.patterns.get('temporal'), '').trim()
        };
    }

    parse(text) {
        if (!text) return null;

        const result = {
            rawContent: text,
            action: null,
            contact: null,
            datetime: null,
            categories: [],
            priority: 'None',
            complexity: null,
            location: null,
            duration: null,
            project: null,
            recurringPattern: null,
            dependencies: null,
            dueDate: null,
            timeOfDay: undefined,
            reminders: undefined,
            urgency: undefined,
            subject: undefined,
            attendees: undefined
        };

        try {
            const { original, sanitized } = this.sanitizeInput(text);

            // Extract action
            const actionMatch = original.match(/\b(call|email|meet|text|review)\b/i);
            if (actionMatch) {
                result.action = actionMatch[1].toLowerCase();
                if (result.action === 'text') {
                    result.categories.push('calls');
                }
            } else if (original.toLowerCase().includes('meeting')) {
                result.action = 'meet';
            }

            // Handle priority
            if (original.toLowerCase().includes('urgent') || original.toLowerCase().includes('important')) {
                result.priority = 'high';
            } else {
                const priorityMatch = original.match(/\b(high|medium|normal|low)\s+priority\b/i);
                if (priorityMatch) {
                    const priority = priorityMatch[1].toLowerCase();
                    result.priority = priority === 'normal' ? 'medium' : priority;
                }
            }

            // Run plugins with appropriate input
            this.plugins.forEach(plugin => {
                try {
                    // Use sanitized input for location, attendees, and project
                    const input = ['location', 'attendees', 'project'].includes(plugin.name) 
                        ? sanitized 
                        : original;
                    
                    const pluginResult = plugin.parse(input, this.patterns);
                    if (pluginResult) {
                        // Always keep reminder arrays as arrays
                        if (plugin.name === 'reminders' && pluginResult.reminders) {
                            result.reminders = pluginResult.reminders;
                        } else {
                            Object.assign(result, pluginResult);
                        }
                    }
                } catch (error) {
                    logger.error(`[NaturalLanguageParser] Error in plugin ${plugin.name}:`, { error });
                }
            });
        } catch (error) {
            logger.error('[NaturalLanguageParser] Error parsing text:', { error, text });
        }

        return result;
    }

    static calculateRelativeDate(text) {
        return require('./parsers/date').calculateRelativeDate(text);
    }
}

module.exports = NaturalLanguageParser; 