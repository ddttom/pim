import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ComplexityParser');

export default {
    name: 'complexity',
    parse(text, patterns) {
        try {
            const complexityMatch = text.match(/\b(complex|standard|quick|simple)\s+(?:task|review|work)\b/i);
            if (complexityMatch) {
                const level = complexityMatch[1].toLowerCase();
                switch (level) {
                    case 'complex':
                        return { complexity: { level: 'high' } };
                    case 'standard':
                        return { complexity: { level: 'medium' } };
                    case 'quick':
                    case 'simple':
                        return { complexity: { level: 'low' } };
                }
            }
            return null;
        } catch (error) {
            logger.error('Error in complexity parser:', { error });
            return null;
        }
    }
};
