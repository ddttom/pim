const CONFIG = require('../../../config/parser.config');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('AttendeesParser');

/**
 * Parse names from comma/and separated string
 * @private
 */
function parseNames(namesString) {
  return namesString
    .split(/(?:\s*,\s*|\s+and\s+)/)
    .map(name => name.trim())
    .filter(name => name && !name.toLowerCase().includes('team'));
}

/**
 * Parse attendees from text
 * @param {string} text - Input text
 * @returns {Object|null} Attendees object
 */
function parse(text) {
  try {
    const people = new Set();
    const teams = new Set();
    let type;

    // Parse team mentions with global flag
    const teamMatches = [...text.matchAll(/team\s+([A-Za-z]+)/gi)];
    for (const match of teamMatches) {
      teams.add(match[1]);
    }

    // Parse invited attendees
    const inviteMatch = text.match(/invite\s+((?:[A-Za-z]+(?:\s*,\s*|\s+and\s+)?)+)/i);
    if (inviteMatch) {
      type = 'invite';
      parseNames(inviteMatch[1]).forEach(name => people.add(name));
    }

    // Parse other attendees
    const withMatch = text.match(/(?:with|,)\s+((?:[A-Za-z]+(?:\s*,\s*|\s+and\s+)?)+)(?=\s+(?:about|team|tomorrow|next|at|on|in|this|last|every|by|\$|#|,)|$)/i);
    if (withMatch) {
      parseNames(withMatch[1]).forEach(name => people.add(name));
    }

    // Parse additional attendees after team mentions
    const afterTeamMatch = text.match(/team\s+[A-Za-z]+(?:\s*,\s*|\s+and\s+)((?:[A-Za-z]+(?:\s*,\s*|\s+and\s+)?)+)/i);
    if (afterTeamMatch) {
      parseNames(afterTeamMatch[1]).forEach(name => people.add(name));
    }

    if (people.size > 0 || teams.size > 0) {
      return {
        people: Array.from(people),
        teams: Array.from(teams),
        ...(type && { type }),
      };
    }

    return null;
  } catch (error) {
    logger.error('Error parsing attendees:', error);
    return null;
  }
}

module.exports = { parse }; 