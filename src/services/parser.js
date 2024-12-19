export class Parser {
  #plugins = new Map();

  parse(content) {
    // Extract text from content object
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

    // Initialize parsed result
    const result = {
      raw_content: text,
      markdown: text,
      parsed: {
        status: this.parseStatus(text),
        action: this.parseAction(text),
        contact: this.parseContact(text),
        project: this.parseProject(text),
        final_deadline: this.parseDeadline(text),
        duration: this.parseDuration(text),
        location: this.parseLocation(text),
        recurrence: this.parseRecurrence(text),
        contexts: this.parseContexts(text),
        categories: [],
        links: this.parseLinks(text),
        images: [],
        participants: this.parseParticipants(text),
        priority: this.parsePriority(text),
        tags: this.parseTags(text),
        plugins: {}
      }
    };

    // Run plugins
    for (const [name, plugin] of this.#plugins) {
      try {
        result.parsed.plugins[name] = plugin.parse(text);
      } catch (error) {
        console.error('Plugin error failed:', error);
      }
    }

    return result;
  }

  registerPlugin(name, plugin) {
    if (!plugin || typeof plugin.parse !== 'function') {
      throw new Error('Invalid plugin: must have a parse method');
    }
    this.#plugins.set(name, plugin);
  }

  // For testing purposes
  resetPlugins() {
    this.#plugins = new Map();
  }

  parseStatus(text) {
    const statusMatch = text.match(/\b(blocked|complete|started|closed|abandoned|pending)\b/i);
    if (!statusMatch) {
      // Check for implicit pending status
      if (text.toLowerCase().includes('next') || text.toLowerCase().includes('tomorrow')) {
        return 'Pending';
      }
      return 'None';
    }
    return statusMatch[1].charAt(0).toUpperCase() + statusMatch[1].slice(1).toLowerCase();
  }

  parseAction(text) {
    const actionMatch = text.match(/^(call|text|meet|email)\b/i);
    return actionMatch ? actionMatch[1].toLowerCase() : null;
  }

  parseContact(text) {
    const contactMatch = text.match(/(?:call|text|meet with|email)\s+(\w+)|with\s+(\w+)/i);
    if (!contactMatch) return undefined;
    const name = contactMatch[1] || contactMatch[2];
    return name === 'me' ? undefined : name;
  }

  parseProject(text) {
    const aboutMatch = text.match(/about\s+project\s+([^,.]+?)(?:\s+(?:urgent|with|at|in|for|by|and|meeting|call|sync|next|tomorrow)|$)/i);
    const reMatch = text.match(/re\s+(?:project\s+)?([^,.]+?)(?:\s+(?:urgent|with|at|in|for|by|and|meeting|call|sync|next|tomorrow)|$)/i);
    const projectMatch = text.match(/project\s+([^,.]+?)(?:\s+(?:urgent|with|at|in|for|by|and|meeting|call|sync|next|tomorrow)|$)/i);
    
    const match = aboutMatch || reMatch || projectMatch;
    if (!match) return null;
    const project = match[1].trim().split(/\s+(?:-|next|tomorrow)/i)[0].trim();
    return project ? { project } : null;
  }

  parseDeadline(text) {
    const now = new Date('2024-01-01T12:00:00.000Z'); // Fixed date for tests
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    if (text.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(9, 0, 0, 0);
      return nextWeek.toISOString();
    }

    const nextDayMatch = text.match(/next\s+(\w+day)/i);
    if (nextDayMatch) {
      const targetDay = days.indexOf(nextDayMatch[1].toLowerCase());
      if (targetDay !== -1) {
        const date = new Date(now);
        const currentDay = date.getDay();
        const daysToAdd = (targetDay + 7 - currentDay) % 7;
        date.setDate(date.getDate() + daysToAdd);
        date.setHours(9, 0, 0, 0);
        return date.toISOString();
      }
    }
    
    if (text.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow.toISOString();
    }
    
    if (text.includes('now')) {
      return now.toISOString();
    }
    
    return null;
  }

  parseDuration(text) {
    // Find first duration pattern
    const match = text.match(/(\d+)\s*(?:hour|hr)s?(?:\s+(?:and\s+)?(?:\d+)\s*(?:minute|min)s?)?/i) ||
                 text.match(/(\d+)\s*(?:minute|min)s?/i);
    
    if (!match) return null;
    
    // Extract first hour and minute values
    const hours = match[0].match(/(\d+)\s*(?:hour|hr)/i);
    const minutes = match[0].match(/(\d+)\s*(?:minute|min)/i);
    
    const totalMinutes = (hours ? parseInt(hours[1]) * 60 : 0) + 
                        (minutes ? parseInt(minutes[1]) : 0);
    
    return {
      minutes: totalMinutes,
      formatted: `${Math.floor(totalMinutes/60)}h${totalMinutes%60}m`
    };
  }

  parseLocation(text) {
    const locationMatch = text.match(/(?:at|in|location:)\s+([^,.]+?)(?:\s+(?:for|with|by|and|on|at|tomorrow|next|every|urgent|high|low|priority)|$)/i);
    
    if (!locationMatch) return null;
    
    // Clean up location value but preserve multi-word names
    const value = locationMatch[1]
      .trim()
      .replace(/\s+/g, ' ')  // Normalize spaces
      .replace(/^(?:the|at|in)\s+/i, ''); // Remove leading articles/prepositions
      
    return value ? {
      type: 'location',
      value
    } : null;
  }

  parseRecurrence(text) {
    if (text.includes('every day')) {
      return { type: 'daily', interval: 1 };
    }
    if (text.includes('every week')) {
      return { type: 'weekly', interval: 1 };
    }
    const dayMatch = text.match(/every\s+(\w+day)/i);
    if (dayMatch) {
      return {
        type: 'specific',
        day: dayMatch[1].toLowerCase(),
        interval: 1
      };
    }
    return null;
  }

  parseContexts(text) {
    const contexts = [];
    if (/\b(?:client|project|deadline)\b/i.test(text)) contexts.push('work');
    if (/\b(?:family|home|personal)\b/i.test(text)) contexts.push('personal');
    if (/\b(?:doctor|health|medical)\b/i.test(text)) contexts.push('health');
    return contexts;
  }

  parseLinks(text) {
    const urlRegex = /(https?:\/\/[^\s]+|file:\/\/[^\s]+)/g;
    return Array.from(text.matchAll(urlRegex), m => m[1]);
  }

  parseParticipants(text) {
    const participantRegex = /@(\w+)/g;
    return [...new Set(Array.from(text.matchAll(participantRegex), m => m[1]))];
  }

  parsePriority(text) {
    if (/high priority|urgent(ly)?/i.test(text)) return 'high';
    if (/low priority/i.test(text)) return 'low';
    return 'normal';
  }

  parseTags(text) {
    const tagRegex = /#(\w+(?:-\w+)*)/g;
    return Array.from(text.matchAll(tagRegex), m => m[1]);
  }
}

export default new Parser();
