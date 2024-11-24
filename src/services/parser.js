const chrono = require('chrono-node');

class NaturalLanguageParser {
    constructor() {
        this.patterns = {
            action: /^(call|email|meet|review)/i,
            contact: /\b[A-Z][a-z]+\b/,
            timeExpression: /(next|this|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|month|quarter|year)/i
        };
    }

    parse(text) {
        const parsed = {
            rawContent: text,
            action: null,
            contact: null,
            datetime: null,
            categories: this.suggestCategories(text),
        };

        // Parse action
        const actionMatch = text.match(this.patterns.action);
        if (actionMatch) {
            parsed.action = actionMatch[1].toLowerCase();
        }

        // Parse contact
        const contactMatch = text.match(this.patterns.contact);
        if (contactMatch) {
            parsed.contact = contactMatch[0];
        }

        // Parse datetime using chrono
        const dates = chrono.parse(text);
        if (dates.length > 0) {
            parsed.datetime = dates[0].start.date();
        }

        return parsed;
    }

    suggestCategories(text) {
        const categories = new Set();
        
        // Action-based categories
        if (text.match(/\b(call|phone|dial)\b/i)) categories.add('calls');
        if (text.match(/\b(email|send|forward)\b/i)) categories.add('email');
        if (text.match(/\b(meet|meeting|appointment)\b/i)) categories.add('meetings');
        if (text.match(/\b(review|check|analyze)\b/i)) categories.add('reviews');
        if (text.match(/\b(buy|purchase|order)\b/i)) categories.add('shopping');
        if (text.match(/\b(pay|bill|invoice)\b/i)) categories.add('finance');
        
        return Array.from(categories);
    }

    calculateRelativeDate(text) {
        const now = new Date();
        const match = text.match(this.patterns.timeExpression);
        
        if (!match) return null;
        
        const [_, modifier, unit] = match;
        const result = new Date(now);

        switch(unit.toLowerCase()) {
            case 'monday': case 'tuesday': case 'wednesday':
            case 'thursday': case 'friday': case 'saturday': case 'sunday':
                const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                    .indexOf(unit.toLowerCase());
                let currentDay = now.getDay();
                let daysToAdd = targetDay - currentDay;

                if (modifier === 'next') {
                    daysToAdd += 7;
                } else if (modifier === 'last') {
                    if (daysToAdd >= 0) daysToAdd -= 7;
                }

                result.setDate(now.getDate() + daysToAdd);
                break;

            case 'month':
                if (modifier === 'next') result.setMonth(now.getMonth() + 1);
                else if (modifier === 'last') result.setMonth(now.getMonth() - 1);
                break;

            case 'quarter':
                if (modifier === 'next') result.setMonth(now.getMonth() + 3);
                else if (modifier === 'last') result.setMonth(now.getMonth() - 3);
                break;

            case 'year':
                if (modifier === 'next') result.setFullYear(now.getFullYear() + 1);
                else if (modifier === 'last') result.setFullYear(now.getFullYear() - 1);
                break;
        }

        return result;
    }
}

module.exports = new NaturalLanguageParser();
