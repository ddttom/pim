const chrono = require('chrono-node');

class Parser {
  constructor(logger) {
    this.logger = logger;
  }

  parse(text) {
    try {
      // Handle null/undefined/empty input
      if (!text) {
        this.logger.warn('Empty text provided to parser');
        return {
          raw_content: '',
          parsed: {
            action: null,
            contact: undefined,
            project: null,
            final_deadline: null,
            status: 'None',
            categories: []
          },
          plugins: {}
        };
      }

      this.logger.info('Parsing text:', text);

      // First find the action to help with contact parsing
      const action = this.#parseAction(text);
      
      const parsed = {
        raw_content: text,
        parsed: {
          action: action,
          contact: this.#parseContact(text, action),
          project: this.#parseProject(text),
          final_deadline: this.#parseDate(text),
          status: this.#parseStatus(text),
          categories: []
        },
        plugins: {}
      };

      this.logger.info('Parse results:', parsed);
      return parsed;
    } catch (error) {
      this.logger.error('Parser error:', error);
      throw error;
    }
  }

  #parseAction(text) {
    if (!text) return null;
    
    const actionWords = ['call', 'email', 'meet', 'review', 'write', 'send', 'text'];
    const words = text.toLowerCase().split(' ');
    return actionWords.find(action => words.includes(action)) || null;
  }

  #parseContact(text, action) {
    if (!text) return undefined;
    
    const words = text.split(' ');
    
    // Common words that should never be contacts
    const commonWords = new Set([
      'me', 'Me', 'I', 'you', 'You', 'we', 'We', 
      'they', 'They', 'it', 'It', 'Project', 'project',
      'Call', 'call', 'Meet', 'meet', 'with', 'With',
      'about', 'About', 'later', 'Later', 'tomorrow',
      'next', 'week', 'month', 'year'
    ]);

    // Look for contact after "with"
    const withIndex = words.findIndex(word => word.toLowerCase() === 'with');
    if (withIndex >= 0 && withIndex < words.length - 1) {
      const nextWord = words[withIndex + 1];
      if (nextWord.match(/^[A-Z]/) && !commonWords.has(nextWord)) {
        return nextWord;
      }
    }

    // Look for contact after action
    if (action) {
      const actionIndex = words.findIndex(word => 
        word.toLowerCase() === action.toLowerCase()
      );
      if (actionIndex >= 0 && actionIndex < words.length - 1) {
        const nextWord = words[actionIndex + 1];
        if (nextWord.match(/^[A-Z]/) && !commonWords.has(nextWord)) {
          return nextWord;
        }
      }
    }

    // Fallback: look for any capitalized word that's not a common word
    for (const word of words) {
      if (word.match(/^[A-Z][a-z]+$/) && !commonWords.has(word)) {
        return word;
      }
    }
    
    return undefined;
  }

  #parseProject(text) {
    if (!text) return null;
    
    // Handle multi-word project names first
    const multiWordMatch = text.match(/project\s+([A-Z][a-zA-Z]+(?:\s+[A-Z]?[a-zA-Z]+)*?)(?=\s*$|\s*[-,.]|\s+(?:next|tomorrow|today|yesterday|on|at|by))/i);
    if (multiWordMatch) {
      return { project: multiWordMatch[1] };
    }
    
    // Try matching "Project X" format at start of text
    const projectStartMatch = text.match(/^Project\s+([A-Z][a-zA-Z]+(?:\s+[A-Z]?[a-zA-Z]+)*?)(?=\s|$)/);
    if (projectStartMatch) {
      return { project: projectStartMatch[1] };
    }
    
    // Look for "project" keyword followed by capitalized word
    const projectMatch = text.match(/project\s+([A-Z][a-zA-Z]+)(?=\s|$)/i);
    if (projectMatch) {
      return { project: projectMatch[1] };
    }
    
    return null;
  }

  #parseDate(text) {
    if (!text) return null;
    
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

  #parseStatus(text) {
    if (!text) return 'None';

    const statusWords = {
      'blocked': 'Blocked',
      'complete': 'Complete',
      'started': 'Started',
      'closed': 'Closed',
      'abandoned': 'Abandoned'
    };

    const lowercaseText = text.toLowerCase();
    for (const [keyword, status] of Object.entries(statusWords)) {
      if (lowercaseText.includes(keyword)) {
        return status;
      }
    }

    return 'None';
  }
}

module.exports = Parser; 
