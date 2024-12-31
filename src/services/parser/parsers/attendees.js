import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('AttendeesParser');

export default {
    name: 'attendees',
    parse(text, patterns) {
        logger.debug('Entering attendees parser', { text });
        try {
            const attendees = { people: [], teams: [] };
            
            // Match team mentions first
            const teamMatches = Array.from(text.matchAll(/team\s+([A-Z][a-z]+)(?=\s*(?:,|\.|$|\s+(?:about|for)))/gi));
            attendees.teams = teamMatches.map(match => match[1].trim());
            logger.debug('Found teams', { teams: attendees.teams });

            // Then match individual attendees
            const peopleMatch = text.match(/with\s+((?:[A-Z][a-z]+(?:\s*,\s*|\s+and\s+)?)+)(?=\s*(?:,|\.|$|\s+(?:about|for)))/i);
            if (peopleMatch) {
                const peopleList = peopleMatch[1]
                    .split(/\s*,\s*|\s+and\s+/)
                    .map(name => name.trim())
                    .filter(name => name && !attendees.teams.includes(name));
                attendees.people = peopleList;
                logger.debug('Found people', { people: attendees.people });
            }

            const hasMatches = attendees.people.length || attendees.teams.length;
            if (hasMatches) {
                logger.debug('Attendees parser found matches', { attendees });
                return { attendees };
            }
            
            logger.debug('Attendees parser found no matches');
            return null;
        } catch (error) {
            logger.error('Error in attendees parser:', { error, text });
            return null;
        } finally {
            logger.debug('Exiting attendees parser');
        }
    }
};
