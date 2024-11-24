const customPlugin = {
  patterns: {
    customPattern: /your-pattern-here/i,
  },

  parser: (text) => {
    // Your custom parsing logic
    return {
      // Your parsed results
    };
  }
};

// Register the plugin
const parser = require('../services/parser');
parser.registerPlugin('custom', customPlugin); 