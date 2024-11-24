const NaturalLanguageParser = require('./core');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('Parser');

// Create parser instance with static methods
const parser = new NaturalLanguageParser();

// Add static methods to the instance
parser.calculateRelativeDate = NaturalLanguageParser.calculateRelativeDate;
parser.getNextDayOfWeek = NaturalLanguageParser.getNextDayOfWeek;

module.exports = parser; 