class Logger {
  constructor(config = {}) {
    this.level = config.level || 'info';
    this.prefix = config.prefix || '';
    
    // Define log levels and their priorities
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  /**
   * Format the log message with timestamp and prefix
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [data] - Additional data to log
   * @returns {string} Formatted log message
   */
  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    const dataString = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    
    return `${timestamp} ${prefix}${level.toUpperCase()}: ${message}${dataString}`;
  }

  /**
   * Check if the log level should be logged
   * @param {string} level - Log level to check
   * @returns {boolean} Whether the level should be logged
   */
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  /**
   * Log an error message
   * @param {string} message - Error message
   * @param {Error|Object} [error] - Error object or additional data
   */
  error(message, error) {
    if (this.shouldLog('error')) {
      const data = error instanceof Error ? 
        { message: error.message, stack: error.stack } : 
        error;
      console.error(this.formatMessage('error', message, data));
    }
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   * @param {Object} [data] - Additional data
   */
  warn(message, data) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {Object} [data] - Additional data
   */
  info(message, data) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, data));
    }
  }

  /**
   * Log a debug message
   * @param {string} message - Debug message
   * @param {Object} [data] - Additional data
   */
  debug(message, data) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  /**
   * Set the log level
   * @param {string} level - New log level
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.level = level;
    } else {
      throw new Error(`Invalid log level: ${level}`);
    }
  }

  /**
   * Set the logger prefix
   * @param {string} prefix - New prefix
   */
  setPrefix(prefix) {
    this.prefix = prefix;
  }
}

module.exports = Logger; 