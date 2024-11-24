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

const logger = createLogger('NaturalLanguageParser');

class NaturalLanguageParser {
  constructor() {
    logger.debug('Initializing NaturalLanguageParser');
    this.patterns = CONFIG.patterns;
    this.compiledPatterns = compilePatterns(this.patterns);
    this.loadDefaultPlugins();
    logger.info('NaturalLanguageParser initialized with patterns:', 
      { patternCount: Object.keys(this.patterns).length });
  }

  parse(text) {
    try {
      logger.info('Starting parse operation:', { text });
      logger.debug('Input validation check');

      if (!text?.trim()) {
        logger.error('Invalid input: empty or whitespace-only text');
        throw new Error('Invalid input: text must be a non-empty string');
      }

      logger.debug('Starting individual parser executions');
      const parsed = {
        rawContent: text,
        action: this.executeParser('action', () => actionParser.parse(text)),
        attendees: this.executeParser('attendees', () => attendeesParser.parse(text)),
        categories: this.executeParser('categories', () => categoriesParser.parse(text)),
        complexity: this.executeParser('complexity', () => complexityParser.parse(text)),
        datetime: null,
        dependencies: this.executeParser('dependencies', () => dependenciesParser.parse(text)),
        duration: this.executeParser('duration', () => durationParser.parse(text)),
        location: this.executeParser('location', () => locationParser.parse(text)),
        project: this.executeParser('project', () => projectParser.parse(text)),
        recurring: this.executeParser('recurring', () => recurringParser.parse(text)),
        status: this.executeParser('status', () => statusParser.parse(text)),
        subject: this.executeParser('subject', () => subjectParser.parse(text)),
        timeOfDay: this.executeParser('time', () => timeParser.parse(text)),
        urgency: this.executeParser('urgency', () => urgencyParser.parse(text)),
        priority: this.executeParser('priority', () => priorityParser.parse(text)),
        reminders: this.executeParser('reminders', () => remindersParser.parse(text)),
        contact: this.executeParser('contact', () => contactParser.parse(text)),
      };

      logger.debug('Parsing dates with chrono');
      const dates = chrono.parse(text);
      if (dates.length > 0 && dates[0].start?.date()) {
        parsed.datetime = dates[0].start.date();
        logger.debug('Found chrono date:', { date: parsed.datetime });
      } else {
        parsed.datetime = this.executeParser('date', () => dateParser.parseRelativeDate(text));
      }

      logger.debug('Running plugin parsers');
      try {
        const pluginResults = pluginManager.parseAll(text);
        if (pluginResults && Object.keys(pluginResults).length > 0) {
          parsed.plugins = pluginResults;
          logger.debug('Plugin results:', { plugins: Object.keys(pluginResults) });
        }
      } catch (pluginError) {
        logger.error('Plugin parsing error:', pluginError);
      }

      logger.debug('Validating and setting defaults');
      validateAndSetDefaults(parsed, text);

      logger.debug('Running final validation');
      const validation = validateResult(parsed);
      if (!validation.isValid) {
        logger.warn('Validation errors:', validation.errors);
      }

      logger.info('Parse operation complete:', {
        action: parsed.action,
        datetime: parsed.datetime,
        categories: parsed.categories?.length || 0,
      });

      return parsed;
    } catch (error) {
      logger.error('Critical error during parse operation:', error);
      throw error;
    }
  }

  executeParser(name, parserFn) {
    try {
      logger.debug(`Executing ${name} parser`);
      const result = parserFn();
      logger.debug(`${name} parser result:`, { result });
      return result;
    } catch (error) {
      logger.error(`Error in ${name} parser:`, error);
      return null;
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