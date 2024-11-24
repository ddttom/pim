/**
 * Location Plugin for Natural Language Parser
 */
const locationPlugin = {
  patterns: {
    building: /(?:building|floor)\s+(?<building>[A-Z0-9]+)/i,
    room: /(?:room|suite)\s+(?<room>[A-Z0-9-]+)/i,
    address: /(?<address>\d+[^,]+(?:Street|Avenue|Road|Lane|Drive))/i,
  },

  parser: (text) => {
    const result = {};
    
    // Check each pattern
    for (const [type, pattern] of Object.entries(locationPlugin.patterns)) {
      const match = text.match(pattern);
      if (match?.groups) {
        result[type] = match.groups[type];
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  }
};

module.exports = locationPlugin; 