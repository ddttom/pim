/**
 * Plugin Manager for Natural Language Parser
 */
const { createLogger } = require('../utils/logger.js');

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.patterns = new Map();
    this.parsers = new Map();
    this.logger = createLogger('PluginManager');
  }

  /**
   * Register a new plugin
   * @param {string} name - Plugin name
   * @param {Object} plugin - Plugin configuration
   * @returns {boolean|null} Success status or null on failure
   */
  register(name, plugin) {
    this.logger.debug('Registering plugin', { name });
    try {
      if (this.plugins.has(name)) {
        this.logger.error('Plugin already registered', { name });
        return null;
      }

      // Validate plugin structure
      if (!this.validatePlugin(plugin)) {
        this.logger.error('Invalid plugin structure', { name, plugin });
        return null;
      }

      this.plugins.set(name, plugin);
      this.patterns.set(name, plugin.patterns);
      this.parsers.set(name, plugin.parser);
      
      this.logger.debug('Plugin registered successfully', { name });
      return true;
    } catch (error) {
      this.logger.error('Plugin registration failed:', { error, name });
      return null;
    }
  }

  /**
   * Validate plugin structure
   * @private
   * @param {Object} plugin - Plugin to validate
   * @returns {boolean} Is plugin valid
   */
  validatePlugin(plugin) {
    this.logger.debug('Validating plugin structure');
    try {
      const isValid = plugin &&
                     typeof plugin.patterns === 'object' &&
                     typeof plugin.parser === 'function';
      
      this.logger.debug('Plugin validation result', { isValid });
      return isValid;
    } catch (error) {
      this.logger.error('Plugin validation failed:', { error });
      return false;
    }
  }

  /**
   * Get all registered patterns
   * @returns {Object|null} Combined patterns from all plugins or null on failure
   */
  getAllPatterns() {
    this.logger.debug('Getting all patterns');
    try {
      const patterns = {};
      for (const [name, pluginPatterns] of this.patterns) {
        patterns[name] = pluginPatterns;
      }
      this.logger.debug('Patterns retrieved', { count: Object.keys(patterns).length });
      return patterns;
    } catch (error) {
      this.logger.error('Failed to get patterns:', { error });
      return null;
    }
  }

  /**
   * Parse text using all registered plugins
   * @param {string} text - Text to parse
   * @returns {Object|null} Combined results from all plugins or null on failure
   */
  parseAll(text) {
    this.logger.debug('Starting parseAll', { text });
    try {
      const results = {};
      for (const [name, parser] of this.parsers) {
        this.logger.debug(`Running parser for ${name}`);
        try {
          const result = parser(text);
          if (result !== null) {
            results[name] = result;
          }
        } catch (error) {
          this.logger.error(`Error in plugin ${name}:`, { error });
          // Continue with other plugins
        }
      }
      
      this.logger.debug('Parse complete', { 
        pluginCount: this.parsers.size,
        resultCount: Object.keys(results).length 
      });
      
      return Object.keys(results).length > 0 ? results : null;
    } catch (error) {
      this.logger.error('Parse operation failed:', { error });
      return null;
    }
  }

  /**
   * Clean up plugin resources
   * @returns {boolean|null} Success status or null on failure
   */
  cleanup() {
    this.logger.debug('Starting plugin cleanup');
    try {
      for (const [name, plugin] of this.plugins) {
        if (typeof plugin.cleanup === 'function') {
          try {
            plugin.cleanup();
          } catch (error) {
            this.logger.error(`Cleanup failed for plugin ${name}:`, { error });
          }
        }
      }
      
      this.plugins.clear();
      this.patterns.clear();
      this.parsers.clear();
      
      this.logger.debug('Cleanup complete');
      return true;
    } catch (error) {
      this.logger.error('Cleanup operation failed:', { error });
      return null;
    }
  }
}

module.exports = new PluginManager();
