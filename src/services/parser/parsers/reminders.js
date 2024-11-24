const { createLogger } = require('../../../utils/logger');
const logger = createLogger('RemindersParser');

module.exports = {
    name: 'reminders',
    parse(text, patterns) {
        try {
            logger.info('Parsing reminders from text:', { text });

            // Split text on "and" to handle multiple reminders
            const reminderParts = text.split(/\s+and\s+|\s*,\s*/);
            logger.info('Split reminder parts:', { parts: reminderParts });

            const allMinutes = [];
            
            // Process each part for reminders
            reminderParts.forEach(part => {
                // Simplified pattern that matches just the numbers and units
                const reminderMatch = part.match(/(\d+)\s+(minutes?|mins?|hours?|hrs?|days?)\s+before/i);
                if (reminderMatch) {
                    const amount = parseInt(reminderMatch[1]);
                    const unit = reminderMatch[2].toLowerCase();
                    let converted;
                    if (unit.startsWith('hour')) converted = amount * 60;
                    else if (unit.startsWith('day')) converted = amount * 1440;
                    else converted = amount;

                    logger.info('Converting reminder:', { 
                        amount, 
                        unit, 
                        converted 
                    });

                    allMinutes.push(converted);
                }
            });

            if (allMinutes.length > 0) {
                logger.info('Final reminder minutes:', { minutes: allMinutes });

                // For single reminders, convert array to number to match test expectations
                const reminderMinutes = allMinutes.length === 1 ? allMinutes[0] : allMinutes;

                return {
                    reminders: {
                        reminderMinutes,
                        type: 'custom'
                    }
                };
            }

            // Handle default meeting reminder
            if (text.includes('meeting') && text.includes('reminder')) {
                logger.info('Using default meeting reminder');
                return {
                    reminders: {
                        reminderMinutes: 15,
                        type: 'default'
                    }
                };
            }

            logger.info('No reminders found');
            return null;
        } catch (error) {
            logger.error('Error in reminders parser:', { error });
            return null;
        }
    }
}; 