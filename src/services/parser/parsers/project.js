const { createLogger } = require('../../../utils/logger');
const logger = createLogger('ProjectParser');

module.exports = {
    name: 'project',
    parse(text, patterns) {
        try {
            // Match Project Name with full capture including "Project"
            const projectMatch = text.match(/Project\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)(?=\s*(?:,|\.|$|\s+(?:tomorrow|next|at|about)))/i);
            if (projectMatch) {
                return {
                    project: {
                        project: `Project ${projectMatch[1].trim()}`
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