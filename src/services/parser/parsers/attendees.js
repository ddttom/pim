import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('AttendeesParser');

// Common words to filter out
const COMMON_WORDS = new Set([
    'and', 'the', 'with', 'to', 'for', 'in', 'on', 'at', 'by', 'me'
]);

export default {
    name: 'attendees',
    parse(text) {
        try {
            const attendees = new Set();
            const participants = new Set();
            
            // Handle team mentions
            if (text.toLowerCase().includes('with the team')) {
                attendees.add('team');
                return { 
                    attendees: Array.from(attendees),
                    participants: Array.from(participants)
                };
            }

            // First check for @mentions
            const mentions = text.match(/@([a-zA-Z]\w+)/g);
            if (mentions) {
                mentions.forEach(mention => {
                    const name = mention.substring(1); // Remove @ symbol
                    if (!COMMON_WORDS.has(name.toLowerCase())) {
                        attendees.add(name);
                        participants.add(name.toLowerCase()); // Add to participants list
                    }
                });
            }

            // Look for names after "with", including comma-separated lists
            if (attendees.size === 0) {
                const withPattern = /\bwith\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s*,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*(?:\s+(?:and|&)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?)/g;
                let match;
                
                while ((match = withPattern.exec(text)) !== null) {
                    // Split by commas first, then by "and" or "&"
                    const nameGroups = match[1].split(/\s*,\s*/);
                    
                    nameGroups.forEach(group => {
                        const names = group.split(/\s+(?:and|&)\s+/);
                        names.forEach(name => {
                            const cleanName = name.trim();
                            if (cleanName && !COMMON_WORDS.has(cleanName.toLowerCase())) {
                                attendees.add(cleanName);
                                // Add first name to participants if it's a multi-word name
                                const firstName = cleanName.split(' ')[0];
                                participants.add(firstName.toLowerCase());
                            }
                        });
                    });
                }
            }

            // Validate final results
            const validAttendees = Array.from(attendees).filter(name => 
                name.length >= 2 && /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(name)
            );

            return {
                attendees: validAttendees,
                participants: Array.from(participants)
            };
        } catch (error) {
            logger.error('Error in attendees parser:', { error: error.message, stack: error.stack });
            return {
                attendees: [],
                participants: [],
                error: 'Failed to parse attendees'
            };
        }
    }
};
