import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('DependenciesParser');

export default {
    name: 'dependencies',
    parse(text, patterns) {
        try {
            const dependencies = [];
            
            // Match "after X" dependencies
            const afterMatches = text.match(/after\s+([^,\.]+?)(?=\s*(?:,|\.|$|\s+(?:and|or)))/gi);
            if (afterMatches) {
                afterMatches.forEach(match => {
                    const dep = match.replace(/^after\s+/i, '').trim();
                    dependencies.push({ type: 'after', task: dep });
                });
            }

            // Match "before X" dependencies
            const beforeMatches = text.match(/before\s+([^,\.]+?)(?=\s*(?:,|\.|$|\s+(?:and|or)))/gi);
            if (beforeMatches) {
                beforeMatches.forEach(match => {
                    const dep = match.replace(/^before\s+/i, '').trim();
                    dependencies.push({ type: 'before', task: dep });
                });
            }

            // Match "depends on X" dependencies
            const dependsMatches = text.match(/depends\s+on\s+([^,\.]+?)(?=\s*(?:,|\.|$|\s+(?:and|or)))/gi);
            if (dependsMatches) {
                dependsMatches.forEach(match => {
                    const dep = match.replace(/^depends\s+on\s+/i, '').trim();
                    dependencies.push({ type: 'depends', task: dep });
                });
            }

            return dependencies.length > 0 ? { dependencies } : null;
        } catch (error) {
            logger.error('Error in dependencies parser:', { error });
            return null;
        }
    }
};
