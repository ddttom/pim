import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('SubjectParser');

export default {
    name: 'subject',
    parse(text, patterns) {
        try {
            // Check for explicit subject after "about"
            const aboutMatch = text.match(/about\s+([^,\.]+?)(?=\s*(?:,|\.|$|\s+(?:tomorrow|next|at)))/i);
            if (aboutMatch) {
                return {
                    subject: {
                        subject: aboutMatch[1].trim(),
                        type: 'afterContact'
                    }
                };
            }

            // Check for hashtags
            const hashtagMatches = Array.from(text.matchAll(/#(\w+)/g));
            if (hashtagMatches.length > 0) {
                return {
                    subject: {
                        tags: hashtagMatches.map(m => m[1]),
                        type: 'hashtag'
                    }
                };
            }

            return null;
        } catch (error) {
            logger.error('Error in subject parser:', { error });
            return null;
        }
    }
};
