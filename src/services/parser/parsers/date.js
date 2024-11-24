const { createLogger } = require('../../../utils/logger');
const logger = createLogger('DateParser');

class DateParser {
    static calculateRelativeDate(text) {
        const now = new Date();
        const lowercaseText = text.toLowerCase();
        
        // Handle "last Friday of the month"
        if (lowercaseText.includes('last friday of the month')) {
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            let lastFriday = new Date(lastDay);
            while (lastFriday.getDay() !== 5) {
                lastFriday.setDate(lastFriday.getDate() - 1);
            }
            return lastFriday;
        }

        // Handle "last" expressions
        if (lowercaseText.includes('last')) {
            const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const mentionedDay = weekdays.find(day => lowercaseText.includes(day));
            if (mentionedDay) {
                const targetDay = weekdays.indexOf(mentionedDay);
                const date = new Date(now);
                let diff = now.getDay() - targetDay;
                if (diff <= 0) diff += 7;
                date.setDate(now.getDate() - diff);
                return date;
            }
        }

        // Handle "next weekend" specifically
        if (lowercaseText.includes('next weekend')) {
            const date = new Date(now);
            let daysUntilNextSaturday = (6 - now.getDay() + 7) % 7 + 7;
            date.setDate(now.getDate() + daysUntilNextSaturday);
            return date;
        }

        // Handle "weekend"
        if (lowercaseText.includes('weekend')) {
            const date = new Date(now);
            let daysUntilSaturday = (6 - now.getDay()) % 7;
            if (daysUntilSaturday === 0 && now.getDay() !== 6) daysUntilSaturday = 7;
            date.setDate(now.getDate() + daysUntilSaturday);
            return date;
        }

        // Handle "this" expressions
        if (lowercaseText.includes('this')) {
            const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const mentionedDay = weekdays.find(day => lowercaseText.includes(day));
            if (mentionedDay) {
                const targetDay = weekdays.indexOf(mentionedDay);
                const date = new Date(now);
                let diff = targetDay - now.getDay();
                if (diff <= 0) diff += 7;
                date.setDate(now.getDate() + diff);
                return date;
            }
        }

        // Handle "next" expressions
        if (lowercaseText.includes('next')) {
            if (lowercaseText.includes('week')) {
                const date = new Date(now);
                date.setDate(now.getDate() + 7);
                return date;
            }
            if (lowercaseText.includes('month')) {
                return new Date(now.getFullYear(), now.getMonth() + 1, 1);
            }
            if (lowercaseText.includes('year')) {
                return new Date(now.getFullYear() + 1, 0, 1);
            }
            if (lowercaseText.includes('weekend')) {
                const date = new Date(now);
                let daysUntilSaturday = (6 - now.getDay() + 7) % 7;
                if (daysUntilSaturday === 0) daysUntilSaturday = 7;
                date.setDate(now.getDate() + daysUntilSaturday);
                return date;
            }
            // Handle next weekday
            const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const mentionedDay = weekdays.find(day => lowercaseText.includes(day));
            if (mentionedDay) {
                const targetDay = weekdays.indexOf(mentionedDay);
                const date = new Date(now);
                let diff = targetDay - now.getDay();
                if (diff <= 0) diff += 7;
                date.setDate(now.getDate() + diff + 7);
                return date;
            }
        }

        // Handle "end of month"
        if (lowercaseText.includes('end of month')) {
            return new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }

        return now;
    }

    static parse(text, patterns) {
        try {
            const dateMatch = text.match(patterns.get('datetime'));
            if (dateMatch) {
                return { datetime: this.calculateRelativeDate(dateMatch[0]) };
            }
            return null;
        } catch (error) {
            logger.error('Error in date parser:', { error });
            return null;
        }
    }
}

module.exports = {
    name: 'date',
    parse: DateParser.parse.bind(DateParser),
    calculateRelativeDate: DateParser.calculateRelativeDate
}; 