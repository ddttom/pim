const NaturalLanguageParser = require('./core');
const dateParser = require('./parsers/date');

// Create singleton instance
const parserInstance = new NaturalLanguageParser();

// Export instance methods with proper binding
module.exports = {
  parse: parserInstance.parse.bind(parserInstance),
  calculateRelativeDate: dateParser.parseRelativeDate,
  
  // Export parser modules for direct access if needed
  parsers: {
    action: require('./parsers/action'),
    attendees: require('./parsers/attendees'),
    categories: require('./parsers/categories'),
    complexity: require('./parsers/complexity'),
    date: require('./parsers/date'),
    dependencies: require('./parsers/dependencies'),
    duration: require('./parsers/duration'),
    location: require('./parsers/location'),
    project: require('./parsers/project'),
    recurring: require('./parsers/recurring'),
    status: require('./parsers/status'),
    subject: require('./parsers/subject'),
    time: require('./parsers/time'),
    urgency: require('./parsers/urgency'),
  },
  
  // Export utilities for direct access if needed
  utils: {
    validation: require('./utils/validation'),
    patterns: require('./utils/patterns'),
    timeUtils: require('./utils/timeUtils'),
    dateUtils: require('./utils/dateUtils'),
  },
}; 