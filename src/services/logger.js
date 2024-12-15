const winston = require('winston');
const path = require('path');
const { app } = require('electron');

class Logger {
  #logger;

  constructor() {
    const userDataPath = app.getPath('userData');
    const logPath = path.join(userDataPath, 'logs');

    this.#logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ 
          filename: path.join(logPath, 'error.log'), 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: path.join(logPath, 'combined.log') 
        })
      ]
    });

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      this.#logger.add(new winston.transports.Console({
        format: winston.format.simple()
      }));
    }
  }

  info(message, meta = {}) {
    this.#logger.info(message, meta);
  }

  error(message, error = null) {
    this.#logger.error(message, {
      error: error ? {
        message: error.message,
        stack: error.stack
      } : null
    });
  }

  warn(message, meta = {}) {
    this.#logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.#logger.debug(message, meta);
  }
}

// Export a singleton instance
module.exports = new Logger(); 
