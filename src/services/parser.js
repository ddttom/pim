const chrono = require('chrono-node');
const logger = require('./logger');

class Parser {
  constructor(logger) {
    this.logger = logger;
  }

  parse(text) {
    this.logger.info('Parsing text:', { text });

    const result = {
      raw_content: text,
      markdown: text,
      parsed: {
        action: this.parseAction(text),
        contact: this.parseContact(text),
        project: this.parseProject(text),
        final_deadline: this.parseDeadline(text),
        participants: this.parseParticipants(text),
        tags: this.parseTags(text),
        priority: this.parsePriority(text),
        status: this.parseStatus(text),
        location: this.parseLocation(text),
        duration: this.parseDuration(text),
        recurrence: this.parseRecurrence(text),
        contexts: this.parseContexts(text),
        categories: this.parseCategories(text),
        images: [],
        links: this.parseLinks(text)
      }
    };

    return result;
  }

  parseLinks(text) {
    const urlRegex = /(?:https?:\/\/|www\.)[^\s)]+/g;
    const fileRegex = /file:\/\/[^\s)]+/g;
    
    const webLinks = text.match(urlRegex) || [];
    const fileLinks = text.match(fileRegex) || [];
    
    return [...webLinks, ...fileLinks];
  }

  parseParticipants(text) {
    const participantRegex = /@(\w+)/g;
    const matches = text.match(participantRegex) || [];
    return matches.map(m => m.substring(1));
  }

  parseAction(text) {
    const actionMap = {
      'call': ['call', 'phone', 'ring', 'dial'],
      'meet': ['meet', 'meeting', 'catch up', 'sync', 'catchup'],
      'email': ['email', 'mail', 'send', 'write to'],
      'review': ['review', 'check', 'look at', 'examine'],
      'write': ['write', 'draft', 'compose', 'create']
    };

    const words = text.toLowerCase().split(' ');
    for (const [action, variations] of Object.entries(actionMap)) {
      if (variations.some(v => text.toLowerCase().includes(v))) {
        return action;
      }
    }
    return null;
  }

  parseContact(text) {
    const words = text.split(' ');
    const actionIndex = words.findIndex(w => 
      ['call', 'meet', 'email'].includes(w.toLowerCase())
    );
    return actionIndex >= 0 && words[actionIndex + 1] 
      ? words[actionIndex + 1] 
      : null;
  }

  parseProject(text) {
    const projectMatch = text.match(/re\s+Project\s+(\w+)/i);
    return projectMatch ? { project: projectMatch[1] } : null;
  }

  parseDeadline(text) {
    // Month variations and misspellings
    const months = {
      // January variations
      'january': 0, 'jan': 0, 'janu': 0, 'janua': 0, 'janurary': 0,
      'january': 0, 'jenuary': 0,
      
      // February variations
      'february': 1, 'feb': 1, 'febr': 1, 'febru': 1, 'feburary': 1,
      'februrary': 1, 'febury': 1,
      
      // March variations
      'march': 2, 'mar': 2, 'march': 2, 'marth': 2, 'merch': 2,
      
      // April variations
      'april': 3, 'apr': 3, 'aprl': 3, 'aprel': 3, 'appril': 3,
      
      // May variations
      'may': 4, 'mai': 4,
      
      // June variations
      'june': 5, 'jun': 5, 'joon': 5, 'juen': 5,
      
      // July variations
      'july': 6, 'jul': 6, 'juley': 6, 'jully': 6, 'julai': 6,
      
      // August variations
      'august': 7, 'aug': 7, 'augst': 7, 'agust': 7, 'augus': 7,
      
      // September variations
      'september': 8, 'sep': 8, 'sept': 8, 'septem': 8, 'septmber': 8,
      'setember': 8, 'septmeber': 8,
      
      // October variations
      'october': 9, 'oct': 9, 'octo': 9, 'octob': 9, 'octber': 9,
      'ocktober': 9, 'oktober': 9,
      
      // November variations
      'november': 10, 'nov': 10, 'novem': 10, 'novmber': 10, 'novmeber': 10,
      'noveber': 10,
      
      // December variations
      'december': 11, 'dec': 11, 'decem': 11, 'decmber': 11, 'decmeber': 11,
      'desember': 11
    };

    // Day variations (existing code)
    const days = {
      // Sunday variations
      'sunday': 0, 'sun': 0, 'sundy': 0, 'sund': 0, 'sonday': 0,
      
      // Monday variations
      'monday': 1, 'mon': 1, 'mondy': 1, 'mondey': 1, 'munday': 1,
      
      // Tuesday variations
      'tuesday': 2, 'tue': 2, 'tues': 2, 'tusday': 2, 'tuseday': 2,
      'tuesd': 2, 'tuez': 2, 'teusday': 2,
      
      // Wednesday variations
      'wednesday': 3, 'wed': 3, 'weds': 3, 'wednsday': 3, 'wensday': 3,
      'wendsday': 3, 'wednessday': 3, 'wednes': 3, 'wedness': 3,
      
      // Thursday variations
      'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4, 'thersday': 4,
      'thirsday': 4, 'thursdy': 4, 'thrusday': 4,
      
      // Friday variations
      'friday': 5, 'fri': 5, 'fridy': 5, 'fryday': 5, 'freeday': 5,
      
      // Saturday variations
      'saturday': 6, 'sat': 6, 'satur': 6, 'satday': 6, 'saterday': 6,
      'satrday': 6, 'saturd': 6
    };

    // Try to match "Month Day" format (e.g., "January 15" or "Jan 15")
    const monthDayMatch = text.match(/(\w+)\s+(\d{1,2})/i);
    if (monthDayMatch) {
      const monthInput = monthDayMatch[1].toLowerCase();
      const day = parseInt(monthDayMatch[2], 10);
      const monthIndex = months[monthInput];

      if (monthIndex !== undefined && day >= 1 && day <= 31) {
        const today = new Date();
        const date = new Date(today.getFullYear(), monthIndex, day, 9, 0, 0, 0);
        
        // If the date has passed, use next year
        if (date < today) {
          date.setFullYear(today.getFullYear() + 1);
        }
        
        return date.toISOString();
      }
    }

    // Try next weekday format (existing code)
    const nextDayMatch = text.match(/next\s+(\w+)/i);
    if (nextDayMatch) {
      const dayInput = nextDayMatch[1].toLowerCase();
      const dayIndex = days[dayInput];
      
      if (dayIndex !== undefined) {
        const today = new Date();
        const currentDay = today.getDay();
        let daysToAdd = dayIndex - currentDay;
        
        // If the day has already passed this week, go to next week
        if (daysToAdd <= 0) {
          daysToAdd += 7;
        }
        
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + daysToAdd);
        // Set to 9 AM by default
        nextDate.setHours(9, 0, 0, 0);
        
        return nextDate.toISOString();
      }
    }

    // Fallback to chrono-node (existing code)
    const results = chrono.parse(text);
    if (results.length > 0) {
      const date = results[0].date();
      // Set time to 9 AM if no specific time was given
      if (!text.toLowerCase().includes('now') && 
          date.getHours() === 12 && 
          date.getMinutes() === 0) {
        date.setHours(9, 0, 0, 0);
      }
      return date.toISOString();
    }

    return null;
  }

  parseTags(text) {
    const matches = text.match(/#(\w+)/g) || [];
    return matches.map(m => m.substring(1));
  }

  parsePriority(text) {
    if (text.toLowerCase().includes('urgently') || 
        text.toLowerCase().includes('asap')) {
      return 'high';
    }
    return 'normal';
  }

  parseStatus(text) {
    if (text.toLowerCase().includes('done') || 
        text.toLowerCase().includes('completed')) {
      return 'complete';
    }
    return 'pending';
  }

  parseLocation(text) {
    // Match common location patterns
    const patterns = [
      /at\s+([^,\.]+(?:(?:,\s*)[^,\.]+)*)/i,  // "at location"
      /in\s+([^,\.]+(?:(?:,\s*)[^,\.]+)*)/i,   // "in location"
      /location:\s*([^,\.]+)/i                  // "location: somewhere"
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          type: 'location',
          value: match[1].trim()
        };
      }
    }
    return null;
  }

  parseDuration(text) {
    const durationPattern = /for\s+(\d+)\s*(hour|hr|minute|min)s?/i;
    const match = text.match(durationPattern);
    
    if (match) {
      const [_, amount, unit] = match;
      const minutes = unit.toLowerCase().startsWith('h') 
        ? parseInt(amount) * 60 
        : parseInt(amount);
      
      return {
        minutes,
        formatted: `${Math.floor(minutes / 60)}h${minutes % 60}m`
      };
    }
    return null;
  }

  parseRecurrence(text) {
    const patterns = {
      daily: /every\s+day/i,
      weekly: /every\s+week/i,
      monthly: /every\s+month/i,
      weekdays: /every\s+weekday/i,
      specific: /every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        return {
          type,
          day: match[1]?.toLowerCase(),
          interval: 1
        };
      }
    }
    return null;
  }

  parseContexts(text) {
    const contexts = {
      work: ['meeting', 'project', 'deadline', 'client', 'report'],
      personal: ['family', 'home', 'shopping', 'birthday', 'holiday'],
      health: ['doctor', 'dentist', 'gym', 'workout', 'medicine'],
      finance: ['bank', 'payment', 'invoice', 'budget', 'tax']
    };

    const matches = new Set();
    const words = text.toLowerCase().split(/\W+/);
    
    for (const [context, keywords] of Object.entries(contexts)) {
      if (keywords.some(k => words.includes(k))) {
        matches.add(context);
      }
    }
    
    return matches.size > 0 ? Array.from(matches) : null;
  }

  parseCategories(text) {
    // Implementation for parsing categories
    // This is a placeholder and should be implemented
    return [];
  }
}

module.exports = Parser; 
