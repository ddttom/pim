const DEFAULT_CONFIG = {
  maxDepth: 3,
  ignoreFiles: ['.git', 'node_modules'],
  outputFormat: 'json',
  days: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  dateModifiers: {
    endOf: 'end of',
    beginningOf: 'beginning of'
  },
  status: {
    values: ['None', 'Blocked', 'Complete', 'Started', 'Closed', 'Abandoned'],
    default: 'None',
    patterns: {
      'Blocked': [/\bblocked\b/i, /\bstuck\b/i],
      'Complete': [/\bcomplete\b/i, /\bfinished\b/i, /\bdone\b/i],
      'Started': [/\bstarted\b/i, /\bin progress\b/i, /\bbegun\b/i],
      'Closed': [/\bclosed\b/i, /\bended\b/i],
      'Abandoned': [/\babandoned\b/i, /\bcancelled\b/i, /\bdropped\b/i]
    }
  }
};

export default DEFAULT_CONFIG;
