const { createLogger } = require('../../../utils/logger');
const logger = createLogger('DateParser');

class DateParser {
    static calculateRelativeDate(text) {
        const now = new Date();
        const lowercaseText = text.toLowerCase();
        
        // Handle "last day of" expressions
        const lastDayMatch = lowercaseText.match(/last (sunday|monday|tuesday|wednesday|thursday|friday|saturday) of (the )?(week|month|year)/i);
        if (lastDayMatch) {
            const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const targetDay = weekdays.indexOf(lastDayMatch[1].toLowerCase());
            const period = lastDayMatch[3].toLowerCase();
            
            const date = new Date(now);
            
            if (period === 'week') {
                // Move to end of current week (Saturday)
                const daysToSaturday = 6 - now.getDay();
                date.setDate(now.getDate() + daysToSaturday);
                // Move backwards to target day
                while (date.getDay() !== targetDay) {
                    date.setDate(date.getDate() - 1);
                }
            } else if (period === 'month') {
                // Move to last day of current month
                date.setMonth(date.getMonth() + 1, 0);
                // Move backwards to target day
                while (date.getDay() !== targetDay) {
                    date.setDate(date.getDate() - 1);
                }
            } else if (period === 'year') {
                // Move to last day of year
                date.setFullYear(date.getFullYear(), 11, 31);
                // Move backwards to target day
                while (date.getDay() !== targetDay) {
                    date.setDate(date.getDate() - 1);
                }
            }
            
            return date;
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
                // First move to next week
                date.setDate(now.getDate() + 7);
                // Then calculate days until target day
                let diff = targetDay - date.getDay();
                if (diff < 0) diff += 7;
                date.setDate(date.getDate() + diff);
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
