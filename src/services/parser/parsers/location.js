const { createLogger } = require('../../../utils/logger');
const logger = createLogger('LocationParser');

module.exports = {
    name: 'location',
    parse(text, patterns) {
        try {
            // Check for Zoom meetings first
            if (text.toLowerCase().includes('zoom')) {
                const zoomLink = text.match(/https:\/\/zoom\.us\/j\/\d+/);
                return {
                    location: {
                        type: 'online',
                        value: 'zoom',
                        ...(zoomLink && { link: zoomLink[0] })
                    }
                };
            }

            // Check for office locations
            const officeMatch = text.match(/\b(?:in|at)\s+(?:the\s+)?office\b/i);
            if (officeMatch) {
                return {
                    location: {
                        type: 'office',
                        value: 'office'
                    }
                };
            }

            // Check for other locations
            const locationMatch = text.match(/(?:in|at)\s+(?:the\s+)?([^,\.]+?)(?=\s*(?:,|\.|$|\s+(?:for|about|tomorrow|next)))/i);
            if (locationMatch) {
                const location = locationMatch[1].trim();
                if (location.toLowerCase() === 'office') {
                    return { location: { type: 'office', value: 'office' } };
                }
                return { location: { type: 'travel', value: location } };
            }

            return null;
        } catch (error) {
            logger.error('Error in location parser:', { error });
            return null;
        }
    }
}; 