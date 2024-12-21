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

// Debug mode can be enabled via environment variable
const DEBUG = process.env.NODE_ENV === 'development';
const debugLog = [];

function log(message, data = null) {
  if (!DEBUG) return;
  
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    message,
    data
  };
  
  debugLog.push(logEntry);
  logger.debug(`[Parser] ${message}`, data || '');
}

// Get debug logs
function getLogs() {
  return [...debugLog];
}

// Clear debug logs
function clearLogs() {
  debugLog.length = 0;
  log('Debug logs cleared');
}

const plugins = new Map();
const patterns = compilePatterns({
  action: /^(call|email|meet|review|follow up|schedule|book|arrange|organize|plan|prepare|write|draft|create|make|do|check|verify|confirm|send|share|update|modify|change|delete|remove|add|text)/i,
  contact: /@(\w+)|(?:call|email|meet|contact|text|with)\s+(\w+)(?:\s*,\s*|\s+and\s+|\s+|$)/i,
  datetime: /\b(today|tomorrow|next\s+(?:week|month|year)|(?:this|next|last)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b(?:in|after|before)\s+(\d+)\s+(?:day|week|month|year)s?\b/i,
  priority: /\b(urgent|high|medium|low|normal)\b/i,
  category: /#([\w-]+)/,
  duration: /(?:for|lasting)\s+(\d+(?:\.\d+)?)\s+(minutes?|mins?|hours?|hrs?)/i,
  location: /(?:in|at|on)\s+(?:the\s+)?([\w\s\d-]+(?:(?:Room|Building|Floor|Suite)\s+[\w\d-]+)?|https?:\/\/[^\s]+)/i,
  complexity: /\b(complex|standard|quick|simple)\s+(?:task|review|work)/i,
  recurring: /\b(?:every|each)\s+(day|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  timeOfDay: /\b(?:in\s+the\s+)?(morning|afternoon|evening)\b|\b(\d{1,2})(?::\d{2})?\s*(?:am|pm)?\b/i,
  reminder: /remind(?:\s+me)?\s+(\d+)\s+(minutes?|mins?|hours?|hrs?|days?)\s+before/i,
  urgency: /\b(asap|urgent|end of day|soon)\b/i,
  subject: /\babout\s+([^,\.]+)|\#(\w+)/i,
  attendees: /(?:with|and)\s+(?!the\s+)([^,\.]+?)(?:\s*,\s*|\s+and\s+|$)/i,
  project: /\bProject\s+([^,\.]+)|\$(\w+)/i,
  status: /(\d+)%\s+complete|(?:not started|completed|in progress)/i,
  zoom: /https:\/\/zoom\.us\/j\/\d+/i,
  temporal: /\b(tomorrow|next|today|later|soon|after|before)\b/i
});

function resetPlugins() {
  plugins.clear();
  // Reload all plugins
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
}

// Initial plugin loading
resetPlugins();

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

  const startTime = performance.now();
  const pluginResults = new Map();

  try {
    for (const [name, plugin] of plugins) {
      const pluginStartTime = performance.now();
      try {
        const pluginResult = plugin.parse(text);
        // Store in plugins object
        result.parsed.plugins[name] = pluginResult;
        
        // Also merge into top level for backward compatibility
        if (pluginResult) {
          Object.entries(pluginResult).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              result.parsed[key] = value;
            }
          });
        }
        
        const duration = performance.now() - pluginStartTime;
        pluginResults.set(name, {
          success: true,
          duration: `${duration.toFixed(2)}ms`,
          result: pluginResult
        });
      } catch (error) {
        const duration = performance.now() - pluginStartTime;
        pluginResults.set(name, {
          success: false,
          duration: `${duration.toFixed(2)}ms`,
          error: error.message,
          stack: error.stack
        });
        logger.error('Plugin error:', { plugin: name, error });
      }
    }
  } catch (error) {
    logger.error('Error running plugins:', { error });
  }

  const totalDuration = performance.now() - startTime;
  log('Completed parsing', {
    textLength: text.length,
    pluginCount: plugins.size,
    totalDuration: `${totalDuration.toFixed(2)}ms`,
    pluginResults: Object.fromEntries(pluginResults)
  });

  return result;
}

function validatePlugin(name, plugin) {
  if (!plugin || typeof plugin !== 'object') {
    throw new Error(`Invalid plugin: ${name} must be an object`);
  }
  if (typeof plugin.parse !== 'function') {
    throw new Error('Invalid plugin: must have a parse method');
  }
  return true;
}

function registerPlugin(name, plugin) {
  if (!name || typeof name !== 'string') {
    throw new Error('Plugin name must be a non-empty string');
  }
  
  validatePlugin(name, plugin);
  plugins.set(name, plugin);
  log(`Registered plugin: ${name}`);
  return true;
}

export default {
  parse,
  getLogs,
  clearLogs,
  resetPlugins,
  registerPlugin,
  getStats: () => ({
    pluginCount: plugins.size,
    registeredPlugins: Array.from(plugins.keys()),
    patternCount: Array.from(plugins.values())
      .reduce((total, plugin) => total + Object.keys(plugin?.patterns || {}).length, 0)
  })
};
