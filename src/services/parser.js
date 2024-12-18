const chrono = require('chrono-node');
const logger = require('./logger');

class Parser {
  constructor(logger) {
    this.logger = logger;
  }

  parse(content) {
    // Extract text from content object
    const text = typeof content === 'object' ? content.raw : content;
    
    if (!text || typeof text !== 'string') {
      return {
        status: 'pending',
        priority: 'normal',
        participants: [],
        dates: [],
        final_deadline: null,
        tags: []
      };
    }

    return {
      status: this.parseStatus(text),
      priority: this.parsePriority(text),
      participants: this.parseParticipants(text),
      dates: this.parseDates(text),
      final_deadline: this.parseFinalDeadline(text),
      tags: this.parseTags(text)
    };
  }

  parseDates(text) {
    const dates = [];
    const datePatterns = [
      // ISO dates: 2024-12-31
      /\b\d{4}-\d{2}-\d{2}\b/g,
      // Common formats: 12/31/2024, 31/12/2024
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      // Written dates: December 31, 2024
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/g,
      // Relative dates: tomorrow, next week
      /\b(?:tomorrow|next\s+(?:week|month|year)|in\s+\d+\s+(?:days?|weeks?|months?|years?))\b/gi
    ];

    datePatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => {
        const date = new Date(match);
        if (!isNaN(date.getTime())) {
          dates.push(date.toISOString());
        }
      });
    });

    return dates;
  }

  parseFinalDeadline(text) {
    const deadlinePatterns = [
      /\bdue(?:\s+by|\s+date)?:\s*([^\n,]+)/i,
      /\bdeadline:\s*([^\n,]+)/i,
      /\bdue\s+([^\n,]+)/i
    ];

    for (const pattern of deadlinePatterns) {
      const match = text.match(pattern);
      if (match) {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }

    // If no explicit deadline found, check if any date is preceded by "by" or "until"
    const byPattern = /\b(?:by|until)\s+([^\n,]+)/i;
    const match = text.match(byPattern);
    if (match) {
      const date = new Date(match[1]);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    return null;
  }

  parseParticipants(text) {
    const participantRegex = /@(\w+)/g;
    const matches = text.match(participantRegex) || [];
    return matches.map(m => m.substring(1));
  }

  parseTags(text) {
    const matches = text.match(/#(\w+)/g) || [];
    return matches.map(m => m.substring(1));
  }

  parsePriority(text) {
    const text_lower = text.toLowerCase();
    if (text_lower.includes('urgent') || 
        text_lower.includes('asap') || 
        text_lower.includes('high priority')) {
      return 'high';
    }
    if (text_lower.includes('low priority') ||
        text_lower.includes('whenever') ||
        text_lower.includes('no rush')) {
      return 'low';
    }
    return 'normal';
  }

  parseStatus(text) {
    const text_lower = text.toLowerCase();
    if (text_lower.includes('done') || text_lower.includes('completed')) {
      return 'complete';
    }
    return 'pending';
  }
}

module.exports = Parser; 
