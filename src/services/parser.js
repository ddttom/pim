import { createLogger } from '../utils/logger.js';
import { compilePatterns } from './parser/utils/patterns.js';

// Import parsers
import action from './parser/parsers/action.js';
import attendees from './parser/parsers/attendees.js';
import categories from './parser/parsers/categories.js';
import complexity from './parser/parsers/complexity.js';
import contact from './parser/parsers/contact.js';
import contexts from './parser/parsers/contexts.js';
import date from './parser/parsers/date.js';
import dependencies from './parser/parsers/dependencies.js';
import duration from './parser/parsers/duration.js';
import links from './parser/parsers/links.js';
import location from './parser/parsers/location.js';
import participants from './parser/parsers/participants.js';
import priority from './parser/parsers/priority.js';
import project from './parser/parsers/project.js';
import recurring from './parser/parsers/recurring.js';
import reminders from './parser/parsers/reminders.js';
import status from './parser/parsers/status.js';
import subject from './parser/parsers/subject.js';
import tags from './parser/parsers/tags.js';
import timeOfDay from './parser/parsers/timeOfDay.js';
import urgency from './parser/parsers/urgency.js';

const logger = createLogger('Parser');
const plugins = new Map();
const patterns = compilePatterns({
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
  temporal: /\b(tomorrow|next|today|later|soon|after|before)\b/i
});

// Load plugins
[
  action, attendees, categories, complexity, contact,
  contexts, date, dependencies, duration, links,
  location, participants, priority, project, recurring,
  reminders, status, subject, tags, timeOfDay, urgency
].forEach(plugin => {
  if (plugin?.name) {
    plugins.set(plugin.name, plugin);
  }
});

function parse(content) {
  const text = content ? (typeof content === 'object' ? content.raw : content) : '';

  if (!text || typeof text !== 'string') {
    return {
      raw_content: '',
      markdown: '',
      parsed: {
        status: 'None',
        action: null,
        contact: null,
        project: null,
        final_deadline: null,
        duration: null,
        location: null,
        recurrence: null,
        contexts: [],
        categories: [],
        links: [],
        images: [],
        participants: [],
        priority: 'normal',
        tags: [],
        plugins: {}
      }
    };
  }

  const result = {
    raw_content: text,
    markdown: text,
    parsed: {
      text,
      plugins: {}
    }
  };

  try {
    for (const [name, plugin] of plugins) {
      try {
        result.parsed.plugins[name] = plugin.parse(text);
      } catch (error) {
        logger.error('Plugin error:', { error });
      }
    }
  } catch (error) {
    logger.error('Error running plugins:', { error });
  }

  return result;
}

export default { parse };
