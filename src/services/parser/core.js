const chrono = require('chrono-node');
const CONFIG = require('../../config/parser.config');
const { createLogger } = require('../../utils/logger');
const pluginManager = require('../../plugins/pluginManager');

const actionParser = require('./parsers/action');
const attendeesParser = require('./parsers/attendees');
const categoriesParser = require('./parsers/categories');
const complexityParser = require('./parsers/complexity');
const dateParser = require('./parsers/date');
const dependenciesParser = require('./parsers/dependencies');
const durationParser = require('./parsers/duration');
const locationParser = require('./parsers/location');
const projectParser = require('./parsers/project');
const recurringParser = require('./parsers/recurring');
const statusParser = require('./parsers/status');
const subjectParser = require('./parsers/subject');
const timeParser = require('./parsers/time');
const urgencyParser = require('./parsers/urgency');
const remindersParser = require('./parsers/reminders');
const priorityParser = require('./parsers/priority');
const contactParser = require('./parsers/contact');

const { validateAndSetDefaults, validateResult } = require('./utils/validation');
const { compilePatterns } = require('./utils/patterns');
const dateUtils = require('./utils/dateUtils');

const logger = createLogger('NaturalLanguageParser');

class NaturalLanguageParser {
  constructor() {
    this.patterns = CONFIG.patterns;
    this.compiledPatterns = compilePatterns(this.patterns);
    this.loadDefaultPlugins();
    logger.info('NaturalLanguageParser initialized');
  }

  parse(text) {
    try {
      logger.info('Starting to parse text:', text);

      if (!text?.trim()) {
        throw new Error('Invalid input: text must be a non-empty string');
      }

      text = dateUtils.preprocessWeekend(text);

      const parsed = {
        rawContent: text,
        action: actionParser.parse(text),
        attendees: attendeesParser.parse(text),
        categories: categoriesParser.parse(text),
        complexity: complexityParser.parse(text),
        datetime: null,
        dependencies: dependenciesParser.parse(text),
        duration: durationParser.parse(text),
        location: locationParser.parse(text),
        project: projectParser.parse(text),
        recurring: recurringParser.parse(text),
        status: statusParser.parse(text),
        subject: subjectParser.parse(text),
        timeOfDay: timeParser.parse(text),
        urgency: urgencyParser.parse(text),
        priority: priorityParser.parse(text),
        reminders: remindersParser.parse(text),
        contact: contactParser.parse(text),
      };

      const dates = chrono.parse(text);
      if (dates.length > 0 && dates[0].start?.date()) {
        parsed.datetime = dates[0].start.date();
      } else {
        parsed.datetime = dateParser.parseRelativeDate(text);
      }

      try {
        const pluginResults = pluginManager.parseAll(text);
        if (pluginResults && Object.keys(pluginResults).length > 0) {
          parsed.plugins = pluginResults;
        }
      } catch (pluginError) {
        logger.error('Plugin parsing error:', pluginError);
      }

      validateAndSetDefaults(parsed, text);

      const validation = validateResult(parsed);
      if (!validation.isValid) {
        logger.warn('Validation errors:', validation.errors);
      }

      logger.info('Parsing complete:', {
        action: parsed.action,
        datetime: parsed.datetime,
        categories: parsed.categories?.length || 0,
      });

      return parsed;
    } catch (error) {
      logger.error('Error parsing text:', error);
      throw error;
    }
  }

  loadDefaultPlugins() {
    try {
      const locationPlugin = require('../../plugins/locationPlugin');
      const datePlugin = require('../../plugins/datePlugin');
      const categoryPlugin = require('../../plugins/categoryPlugin');

      pluginManager.register('location', locationPlugin);
      pluginManager.register('date', datePlugin);
      pluginManager.register('category', categoryPlugin);

      logger.info('Default plugins loaded');
    } catch (error) {
      logger.error('Error loading default plugins:', error);
    }
  }
}

module.exports = NaturalLanguageParser; 