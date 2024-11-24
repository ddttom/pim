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
};

// Import LinksParser
const linksParser = require('./parser/parsers/links');

class Parser {
  constructor(logger) {
    this.logger = logger;
    this.plugins = new Map();
    this.parsers = new Map();
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
        plugins: {},
        links: [],
      };
    }

    const result = {
      reminders: this.parseReminders(text),
      duration: this.parseDuration(text),
      timeOfDay: this.parseTimeOfDay(text),
      recurring: this.parseRecurring(text),
      priority: this.parsePriority(text),
      location: this.parseLocation(text),
      action: this.parseAction(text),
      contact: this.parseContact(text),
      subject: this.parseSubject(text),
      links: linksParser.parse(text),
      urgency: this.parseUrgency(text),
      complexity: this.parseComplexity(text),
      attendees: this.parseAttendees(text),
      project: this.parseProject(text),
      status: this.parseStatus(text),
      plugins: {},
      categories: this.parseCategories(text),
      datetime: this.parseDateTime(text),
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
   * @returns {Date} Calculated date
   */
  calculateRelativeDate(text) {
    const now = new Date();
    
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

    // Handle "last Wednesday" patterns
    const lastDayMatch = text.match(/last\s+(\w+)(?!\s+of)/i);
    if (lastDayMatch) {
      const day = this.getDayNumber(lastDayMatch[1]);
      if (day !== undefined) {
        const date = new Date(now);
        // First go back 7 days
        date.setDate(date.getDate() - 7);
        // Then adjust to the target day within that week
        const currentDay = date.getDay();
        const daysToAdd = ((day - currentDay + 7) % 7);
        date.setDate(date.getDate() + daysToAdd);
        return date;
      }
    }

    // Handle "last X of the month" patterns
    const lastOfMonthMatch = text.match(/last\s+(\w+)\s+of\s+the\s+month/i);
    if (lastOfMonthMatch) {
      const targetDay = this.getDayNumber(lastOfMonthMatch[1]);
      if (targetDay !== undefined) {
        const date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        while (date.getDay() !== targetDay) {
          date.setDate(date.getDate() - 1);
        }
        return date;
      }
    }

    // Handle "the weekend" and "next weekend"
    if (text.includes('weekend')) {
      const date = new Date(now);
      const saturday = 6;
      const daysToAdd = text.includes('next') ? 
        ((saturday + 7 - now.getDay()) % 7) + 7 :
        ((saturday + 7 - now.getDay()) % 7);
      date.setDate(now.getDate() + daysToAdd);
      return date;
    }

    // Handle "end of month"
    if (text.includes('end of month')) {
      return new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Handle "beginning of next month"
    if (text.includes('beginning of next month')) {
      return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    // Handle "next year"
    if (text.includes('next year')) {
      return new Date(now.getFullYear() + 1, 0, 1);
    }

    return now;
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
    if (text.includes('urgent') || text.includes('important')) {
      return 'high';
    }
    if (text.includes('normal priority')) {
      return 'medium';
    }
    if (text.includes('low priority')) {
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
      'email': 'email',
      'review': 'review',
      'contact': 'call',
      'see': 'meet'  // Normalize "see" to "meet"
    };
    
    const actions = Object.keys(actionMap);
    
    // Look for action at the start of the text
    const startActionRegex = new RegExp(`^(${actions.join('|')})\\b`, 'i');
    const actionMatch = lowerText.match(startActionRegex);
    if (actionMatch) {
      const action = actionMatch[1].toLowerCase();
      return actionMap[action];
    }
    
    // Look for action anywhere in text
    const midActionRegex = new RegExp(`\\b(${actions.join('|')})\\b`, 'i');
    const midActionMatch = lowerText.match(midActionRegex);
    if (midActionMatch) {
      const action = midActionMatch[1].toLowerCase();
      return actionMap[action];
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
    if (text.match(/\btext\s+/i)) {
      const match = text.match(/\btext\s+(\w+)(?=\s|$)/i);
      if (match) return match[1].toLowerCase();
    }

    // Handle call/contact/see format
    const contactMatch = text.match(/\b(?:call|contact|see)\s+(\w+)(?=\s|$)/i);
    if (contactMatch) {
      return contactMatch[1].toLowerCase();
    }

    // Handle "with" format for multiple contacts
    const withMatch = text.match(/\bwith\s+([^,\.]+?)(?=\s+(?:every|tomorrow|morning|afternoon|evening|about|at|in|for|$))/i);
    if (withMatch) {
      const contactText = withMatch[1];
      const contacts = contactText.split(/(?:,|\s+and\s+)/)
        .map(name => name.trim().toLowerCase())
        .filter(name => !name.startsWith('team')); // Filter out team mentions
      return contacts[0] || null; // Return first contact or null
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
    // Parse project name with better boundaries
    const projectMatch = text.match(/project\s+([^,\s]+(?:\s+[^,\s]+)*?)(?=\s*(?:before|after|by|tomorrow|morning|afternoon|evening|about|at|in|for|next|last|this|on|$))/i);
    if (projectMatch) {
      // Proper case the project name
      const projectName = projectMatch[1]
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      console.log('Found project:', projectName); // Debug log
      return { project: projectName };
    }

    // Parse contexts
    const contexts = text.match(/\$(\w+)/g);
    if (contexts) {
      return { contexts: contexts.map(ctx => ctx.substring(1)) };
    }

    return null;
  }

  /**
   * Parse status information from text
   * @param {string} text - Input text
   * @returns {Object|null} Status information
   */
  parseStatus(text) {
    const progressMatch = text.match(/(\d+)%/);
    if (progressMatch) {
      return { progress: parseInt(progressMatch[1], 10) };
    }
    return null;
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
    
    // Try to parse relative date
    const relativeDate = this.calculateRelativeDate(text);
    if (relativeDate) {
      return relativeDate;
    }
    
    return null;
  }
}

module.exports = Parser; 