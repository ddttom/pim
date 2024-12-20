import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ProjectParser');

export default {
    name: 'project',
    parse(text, patterns) {
        try {
            // Match Project Name with full capture including "Project"
            const projectMatch = text.match(/Project\s+([A-Za-z][A-Za-z]+(?:\s*[A-Za-z][A-Za-z]+)*)/i);
            if (projectMatch) {
                const projectName = projectMatch[1].replace(/\s+/g, ' ').trim();
                return {
                    project: {
                        project: `Project ${projectName}`
                    }
                };
            }

            // Match Context Tags
            const contextMatches = Array.from(text.matchAll(/\$(\w+)/g));
            if (contextMatches.length > 0) {
                return {
                    project: {
                        contexts: contextMatches.map(match => match[1])
                    }
                };
            }

            return null;
        } catch (error) {
            logger.error('Error in project parser:', { error });
            return null;
        }
    }
};
