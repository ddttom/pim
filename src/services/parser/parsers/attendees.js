const { createLogger } = require('../../../utils/logger');
const logger = createLogger('AttendeesParser');

module.exports = {
    name: 'attendees',
    parse(text, patterns) {
        try {
            const attendees = { people: [], teams: [] };
            
            // Match team mentions first
            const teamMatches = Array.from(text.matchAll(/team\s+([A-Z][a-z]+)(?=\s*(?:,|\.|$|\s+(?:about|for)))/gi));
            attendees.teams = teamMatches.map(match => match[1].trim());

            // Then match individual attendees
            const peopleMatch = text.match(/with\s+((?:[A-Z][a-z]+(?:\s*,\s*|\s+and\s+)?)+)(?=\s*(?:,|\.|$|\s+(?:about|for)))/i);
            if (peopleMatch) {
                const peopleList = peopleMatch[1]
                    .split(/\s*,\s*|\s+and\s+/)
                    .map(name => name.trim())
                    .filter(name => name && !attendees.teams.includes(name));
                attendees.people = peopleList;
            }

            return attendees.people.length || attendees.teams.length ? { attendees } : null;
        } catch (error) {
            logger.error('Error in attendees parser:', { error });
            return null;
        }
    }
}; 