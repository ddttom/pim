/**
 * Plugin Manager for Natural Language Parser
 */
class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.patterns = new Map();
    this.parsers = new Map();
  }

  /**
   * Register a new plugin
   * @param {string} name - Plugin name
   * @param {Object} plugin - Plugin configuration
   */
  register(name, plugin) {
    if (this.plugins.has(name)) {
      throw new Error(`Plugin ${name} is already registered`);
    }

    // Validate plugin structure
    if (!this.validatePlugin(plugin)) {
      throw new Error(`Invalid plugin structure for ${name}`);
    }

    this.plugins.set(name, plugin);
    this.patterns.set(name, plugin.patterns);
    this.parsers.set(name, plugin.parser);
  }

  /**
   * Validate plugin structure
   * @private
   * @param {Object} plugin - Plugin to validate
   * @returns {boolean} Is plugin valid
   */
  validatePlugin(plugin) {
    return plugin &&
           typeof plugin.patterns === 'object' &&
           typeof plugin.parser === 'function';
  }

  /**
   * Get all registered patterns
   * @returns {Object} Combined patterns from all plugins
   */
  getAllPatterns() {
    const patterns = {};
    for (const [name, pluginPatterns] of this.patterns) {
      patterns[name] = pluginPatterns;
    }
    return patterns;
  }

  /**
   * Parse text using all registered plugins
   * @param {string} text - Text to parse
   * @returns {Object} Combined results from all plugins
   */
  parseAll(text) {
    const results = {};
    for (const [name, parser] of this.parsers) {
      try {
        results[name] = parser(text);
      } catch (error) {
        console.error(`Error in plugin ${name}:`, error);
      }
    }
    return results;
  }
}

module.exports = new PluginManager(); 