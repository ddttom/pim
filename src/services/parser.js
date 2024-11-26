// Configuration constants
const config = {
  DEFAULT_MEETING_REMINDER: 15, // minutes
  TIME_UNITS: {
    minute: 1,
    minutes: 1,
    hour: 60,
    hours: 60,
    day: 1440,
    days: 1440,
  },
  TIME_OF_DAY: {
    morning: { start: 9, end: 12 },
    afternoon: { start: 12, end: 17 },
    evening: { start: 17, end: 21 },
  },
  status: {
    values: ['None', 'Blocked', 'Complete', 'Started', 'Closed', 'Abandoned'],
    default: 'None',
    patterns: {
      'Blocked': [/\bblocked\b/i, /\bstuck\b/i],
      'Complete': [/\bcomplete\b/i, /\bfinished\b/i, /\bdone\b/i],
      'Started': [/\bstarted\b/i, /\bin progress\b/i, /\bbegun\b/i],
      'Closed': [/\bclosed\b/i, /\bended\b/i],
      'Abandoned': [/\babandoned\b/i, /\bcancelled\b/i, /\bdropped\b/i]
    }
  },
};

// Import LinksParser
const linksParser = require('./parser/parsers/links');

class Parser {
  constructor(logger) {
    this.logger = logger;
    this.plugins = new Map();
    this.parsers = new Map();
    this.config = config;
    this.initializeDefaultParsers();
  }

  /**
   * Initialize default parsers
   */
  initializeDefaultParsers() {
    // Add default parsers here
    this.registerParser('duration', this.parseDuration.bind(this));
    this.registerParser('timeOfDay', this.parseTimeOfDay.bind(this));
    this.registerParser('recurring', this.parseRecurring.bind(this));
    this.registerParser('priority', this.parsePriority.bind(this));
    this.registerParser('location', this.parseLocation.bind(this));
    this.registerParser('action', this.parseAction.bind(this));
    this.registerParser('contact', this.parseContact.bind(this));
    this.registerParser('subject', this.parseSubject.bind(this));
    this.registerParser('urgency', this.parseUrgency.bind(this));
    this.registerParser('complexity', this.parseComplexity.bind(this));
    this.registerParser('attendees', this.parseAttendees.bind(this));
    this.registerParser('project', this.parseProject.bind(this));
    this.registerParser('status', this.parseStatus.bind(this));
    this.registerParser('links', linksParser.parse.bind(linksParser));
  }

  /**
   * Register a parser function
   * @param {string} name - Parser name
   * @param {Function} parser - Parser function
   */
  registerParser(name, parser) {
    if (typeof parser !== 'function') {
      throw new Error(`Invalid parser: ${name} must be a function`);
    }
    this.parsers.set(name, parser);
  }

  /**
   * Register a plugin
   * @param {string} name - Plugin name
   * @param {Object} plugin - Plugin implementation
   */
  registerPlugin(name, plugin) {
    if (!plugin || typeof plugin.parse !== 'function') {
      throw new Error('Invalid plugin: must have a parse method');
    }
    this.plugins.set(name, plugin);
  }

  /**
   * Parse input text
   * @param {string} text - Input text to parse
   * @returns {Object} Parsed results
   */
  parse(text) {
    // Handle null/undefined input
    if (!text) {
      return {
        raw_content: '',
        parsed: {
          status: this.config.status.default
        },
        plugins: {}  // Initialize empty plugins object
      };
    }

    // Parse all fields
    const parsedDateTime = this.parseDateTime(text);
    
    const result = {
      raw_content: text,
      parsed: {
        action: this.parseAction(text),
        contact: this.parseContact(text),
        project: this.parseProject(text),
        final_deadline: parsedDateTime,
        location: this.parseLocation(text),
        priority: this.parsePriority(text),
        subject: this.parseSubject(text),
        urgency: this.parseUrgency(text),
        complexity: this.parseComplexity(text),
        attendees: this.parseAttendees(text),
        status: this.parseStatus(text),
        categories: this.parseCategories(text),
        reminders: this.parseReminders(text)
      },
      plugins: {}  // Initialize empty plugins object
    };

    // Run plugins
    for (const [name, plugin] of this.plugins) {
      try {
        const pluginResult = plugin.parse(text);
        if (pluginResult) {
          result.plugins[name] = pluginResult;
        }
      } catch (error) {
        this.logger.error(`Plugin ${name} failed:`, error);
      }
    }

    // Remove null values from parsed results
    Object.keys(result.parsed).forEach(key => {
      if (result.parsed[key] === null) {
        delete result.parsed[key];
      }
    });

    this.logger.debug('Parsed result:', result);
    return result;
  }

  /**
   * Parse duration from text
   * @param {string} text - Input text
   * @returns {Object|null} Duration object
   */
  parseDuration(text) {
    if (!text) return null;
    
    const durationRegex = /(?:for|lasting)\s+(\d+)\s*(minute|minutes|hour|hours|min|hrs?)/i;
    const match = text.match(durationRegex);
    
    if (match) {
      const amount = parseInt(match[1], 10);
      let unit = match[2].toLowerCase();
      
      // Normalize units
      if (unit === 'min' || unit === 'minute') unit = 'minutes';
      if (unit === 'hr' || unit === 'hrs' || unit === 'hour') unit = 'hours';
      
      return { [unit]: amount };
    }
    return null;
  }

  /**
   * Parse time of day from text
   * @param {string} text - Input text
   * @returns {Object|null} Time of day object
   */
  parseTimeOfDay(text) {
    // First check for specific time formats
    const timeMatch = text.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridian = timeMatch[3]?.toLowerCase();
      
      // Convert to 24-hour format
      if (meridian === 'pm' && hour < 12) hour += 12;
      if (meridian === 'am' && hour === 12) hour = 0;
      
      // Determine period based on hour
      let period;
      if (hour >= 9 && hour < 12) period = 'morning';
      else if (hour >= 12 && hour < 17) period = 'afternoon';
      else if (hour >= 17 && hour < 21) period = 'evening';
      
      return {
        hour,
        minutes,
        period,
        ...(period && config.TIME_OF_DAY[period])
      };
    }

    // Then check for time periods
    for (const [period, times] of Object.entries(config.TIME_OF_DAY)) {
      if (text.toLowerCase().includes(period)) {
        return { period, ...times };
      }
    }
    return null;
  }

  /**
   * Parse recurring pattern from text
   * @param {string} text - Input text
   * @returns {Object|null} Recurring pattern object
   */
  parseRecurring(text) {
    if (text.includes('every day')) {
      return { type: 'daily' };
    }
    const weeklyMatch = text.match(/every\s+(\w+day)/i);
    if (weeklyMatch) {
      return { type: 'weekly', interval: weeklyMatch[1].toLowerCase() };
    }
    if (text.includes('every month')) {
      return { type: 'monthly' };
    }
    return null;
  }

  /**
   * Calculate relative date from natural language
   * @param {string} text - Input text describing relative date
   * @returns {Date|null} Calculated date
   */
  calculateRelativeDate(text) {
    const now = this.getCurrentDate();
    
    // Handle "tomorrow"
    if (text.toLowerCase().includes('tomorrow')) {
        const date = new Date(now);
        date.setDate(now.getDate() + 1);
        return date;
    }

    // Handle "next Wednesday" type patterns
    const nextDayMatch = text.match(/next\s+(\w+)/i);
    if (nextDayMatch) {
        const day = this.getDayNumber(nextDayMatch[1]);
        if (day !== undefined) {
            const date = new Date(now);
            date.setDate(now.getDate() + ((day + 7 - now.getDay()) % 7) + 7);
            return date;
        }
    }

    // Handle "this Wednesday" patterns
    const thisDayMatch = text.match(/this\s+(\w+)/i);
    if (thisDayMatch) {
        const day = this.getDayNumber(thisDayMatch[1]);
        if (day !== undefined) {
            const date = new Date(now);
            date.setDate(now.getDate() + ((day + 7 - now.getDay()) % 7));
            return date;
        }
    }

    return null;
  }

  /**
   * Parse reminder text and extract reminder information
   * @param {string} text - Input text to parse
   * @returns {Object} Parsed reminder information
   */
  parseReminders(text) {
    if (!text) return null;
    
    this.logger.info('[Parser] Parsing reminders from text:', { text });

    // Extract reminder times
    const reminderMinutes = this.extractReminderTimes(text);

    if (reminderMinutes.length === 0) {
      if (text.includes('reminder') || text.includes('remind')) {
        this.logger.info('[Parser] Using default meeting reminder');
        return {
          reminderMinutes: config.DEFAULT_MEETING_REMINDER,
          type: 'default'
        };
      }
      return null;
    }

    this.logger.info('[Parser] Final reminder minutes:', { minutes: reminderMinutes });
    return {
      reminderMinutes: reminderMinutes.length === 1 ? reminderMinutes[0] : reminderMinutes,
      type: 'custom'
    };
  }

  /**
   * Extract reminder times from text
   * @param {string} text - Input text
   * @returns {number[]} Array of reminder times in minutes
   */
  extractReminderTimes(text) {
    const reminderMinutes = [];
    const reminderRegex = /(\d+)\s*(minute|minutes|hour|hours|day|days)\s*before/gi;
    
    let match;
    while ((match = reminderRegex.exec(text)) !== null) {
      const amount = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      
      const converted = amount * config.TIME_UNITS[unit];
      
      this.logger.info('[Parser] Converting reminder:', {
        amount,
        unit,
        converted,
      });
      
      reminderMinutes.push(converted);
    }

    return reminderMinutes;
  }

  /**
   * Convert day name to number (0-6)
   * @param {string} dayName - Name of the day
   * @returns {number} Day number (0-6)
   */
  getDayNumber(dayName) {
    const days = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    return days[dayName.toLowerCase()];
  }

  /**
   * Parse priority from text
   * @param {string} text - Input text
   * @returns {string|null} Priority level
   */
  parsePriority(text) {
    if (text.match(/\b(urgent|urgently|asap|important)\b/i)) {
      return 'high';
    }
    if (text.match(/\b(normal priority)\b/i)) {
      return 'medium';
    }
    if (text.match(/\b(low priority|whenever)\b/i)) {
      return 'low';
    }
    return null;
  }

  /**
   * Parse location from text
   * @param {string} text - Input text
   * @returns {Object|null} Location object
   */
  parseLocation(text) {
    if (text.includes('in the office')) {
      return { type: 'office', value: 'office' };
    }
    
    if (text.includes('zoom')) {
      const location = { type: 'online', value: 'zoom' };
      const links = linksParser.parse(text);
      if (links.length > 0) {
        location.link = links[0];
      }
      return location;
    }
    
    const locationMatch = text.match(/in\s+([^,\.]+?)(?=\s+(?:tomorrow|morning|afternoon|evening|about|at|for|$)|$)/i);
    if (locationMatch) {
      return { type: 'travel', value: locationMatch[1].trim() };
    }
    
    return null;
  }

  /**
   * Parse action from text
   * @param {string} text - Input text
   * @returns {string|null} Action type
   */
  parseAction(text) {
    // Convert to lowercase for case-insensitive matching
    const lowerText = text.toLowerCase();
    
    // Define valid actions with their normalizations
    const actionMap = {
      'call': 'call',
      'text': 'text',
      'meet': 'meet',
      'meeting': 'meet',
      'email': 'email',
      'review': 'review',
      'contact': 'call',
      'see': 'meet',
      'zoom': 'meet'
    };

    // Look for action at the start of the text
    const startWords = lowerText.split(/\s+/);
    if (startWords[0] in actionMap) {
      return actionMap[startWords[0]];
    }
    
    // If not found at start, look for action words in specific patterns
    const patterns = [
      /\b(?:zoom|team)\s+meeting\b/i,
      /\b(?:text|call|meet|email|review)\s+\w+/i,
      /\bmeeting\s+(?:with|for)\b/i
    ];

    for (const pattern of patterns) {
      const match = lowerText.match(pattern);
      if (match) {
        const actionWord = match[0].split(/\s+/)[0].toLowerCase();
        return actionMap[actionWord] || (match[0].includes('meeting') ? 'meet' : null);
      }
    }
    
    return null;
  }

  /**
   * Parse contact from text
   * @param {string} text - Input text
   * @returns {string|null} Contact name
   */
  parseContact(text) {
    // Handle text message format
    const contactPatterns = [
      /(?:call|text|contact|meet|email)\s+(\w+)(?=\s|$|\s*,|\s+about)/i,
      /\bwith\s+(\w+)(?:\s+(?:and|,)\s+\w+)*(?=\s|$|\s*,|\s+about)/i
    ];

    for (const pattern of contactPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        // Don't return common words that might be mistaken for names
        const commonWords = ['me', 'him', 'her', 'them', 'now', 'later', 'team'];
        if (!commonWords.includes(match[1].toLowerCase())) {
          return match[1];
        }
      }
    }

    return null;
  }

  /**
   * Parse subject from text
   * @param {string} text - Input text
   * @returns {Object|null} Subject information
   */
  parseSubject(text) {
    // Parse hashtags
    const hashtags = text.match(/#(\w+)/g);
    if (hashtags) {
      return {
        tags: hashtags.map(tag => tag.substring(1)),
        type: 'hashtag'
      };
    }

    // Parse explicit subject
    const aboutMatch = text.match(/about\s+([^,\.]+)/i);
    if (aboutMatch) {
      return {
        subject: aboutMatch[1].trim(),
        type: 'afterContact'
      };
    }

    return null;
  }

  /**
   * Parse urgency from text
   * @param {string} text - Input text
   * @returns {Object|null} Urgency information
   */
  parseUrgency(text) {
    if (text.includes('asap')) return { level: 'immediate' };
    if (text.includes('end of day')) return { level: 'today' };
    if (text.includes('soon')) return { level: 'soon' };
    return null;
  }

  /**
   * Parse complexity from text
   * @param {string} text - Input text
   * @returns {Object|null} Complexity information
   */
  parseComplexity(text) {
    if (text.includes('complex')) return { level: 'high' };
    if (text.includes('standard')) return { level: 'medium' };
    if (text.includes('quick')) return { level: 'low' };
    return null;
  }

  /**
   * Parse attendees from text
   * @param {string} text - Input text
   * @returns {Object} Attendees information
   */
  parseAttendees(text) {
    const people = [];
    const teams = [];

    // Parse team mentions
    const teamMatches = text.match(/team\s+(\w+)/gi);
    if (teamMatches) {
      teamMatches.forEach(match => {
        const team = match.replace(/team\s+/i, '');
        teams.push(team);
      });
    }

    // Parse individual attendees
    const withMatch = text.match(/with\s+([^\.]+?)(?=\s+(?:tomorrow|morning|afternoon|evening|about|at|in|for|$))/i);
    if (withMatch) {
      const attendeeText = withMatch[1];
      const attendees = attendeeText.split(/(?:,|\s+and\s+)/)
        .map(name => name.trim())
        .filter(name => !name.toLowerCase().startsWith('team')); // Filter out team mentions
      people.push(...attendees);
    }

    return { people, teams };
  }

  /**
   * Parse project information from text
   * @param {string} text - Input text
   * @returns {Object|null} Project information
   */
  parseProject(text) {
    const result = {};

    // Parse project name patterns with better boundaries
    const projectPatterns = [
        /\bProject\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?=\s*(?:meeting|tomorrow|next|at|on|in|this|last|every|by|\$|#|,|$))/i,
        /\bfor\s+Project\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?=\s*(?:meeting|tomorrow|next|at|on|in|this|last|every|by|\$|#|,|$))/i,
        /\bproject\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?=\s|$|\s*,)/i,
        /\babout\s+(?:project\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)(?=\s|$|\s*,)/i
    ];

    for (const pattern of projectPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            // Extract just the project name without any following words
            const projectName = match[1].trim().split(/\s+(?:meeting|tomorrow|next)/i)[0];
            result.project = projectName;
            break;
        }
    }

    // Parse hashtags
    const hashtags = text.match(/#(\w+)/g);
    if (hashtags) {
        result.tags = hashtags.map(tag => tag.substring(1));
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  /**
   * Parse status from text
   * @param {string} text - Input text
   * @returns {string} Status value
   */
  parseStatus(text) {
    if (!text) return this.config.status.default;
    
    const lowerText = text.toLowerCase();
    const statusPatterns = this.config.status.patterns;

    // Check each status pattern
    for (const [status, patterns] of Object.entries(statusPatterns)) {
        for (const pattern of patterns) {
            if (pattern.test(lowerText)) {
                return status;
            }
        }
    }

    // Default to None if no patterns match
    return this.config.status.default;
  }

  /**
   * Parse categories from text
   * @param {string} text - Input text
   * @returns {string[]} Array of categories
   */
  parseCategories(text) {
    const categories = [];
    if (text.includes('text') || text.includes('call')) {
      categories.push('calls');
    }
    return categories;
  }

  /**
   * Parse datetime from text
   * @param {string} text - Input text
   * @returns {Date|null} Parsed datetime
   */
  parseDateTime(text) {
    if (!text) return null;

    const lowerText = text.toLowerCase();

    // Check for "now" keyword
    if (lowerText.includes('now')) {
        return this.getCurrentDate().toISOString();
    }

    // Check for "next week"
    if (lowerText.includes('next week')) {
        const date = this.getCurrentDate();
        date.setDate(date.getDate() + 7);
        date.setHours(9, 0, 0, 0);
        return date.toISOString();
    }
    
    // Try to parse relative date
    const relativeDate = this.calculateRelativeDate(text);
    if (relativeDate) {
        // Always set to 9 AM for any date without specific time
        relativeDate.setHours(9, 0, 0, 0);
        return relativeDate.toISOString();
    }

    return null;
  }

  // Add helper method to get current date
  getCurrentDate() {
    return new Date();
  }
}

module.exports = Parser; 