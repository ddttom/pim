import parser from '../../src/services/parser.js';
import { jest } from '@jest/globals';

describe('Individual Parser Tests', () => {
    beforeEach(() => {
        // Mock Date to have consistent test results
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-01'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Action Parser', () => {
        const testCases = [
            ['call John', 'call'],
            ['email the team', 'email'],
            ['meet with Sarah', 'meet'],
            ['review documents', 'review'],
            ['schedule meeting', 'schedule'],
            ['book conference room', 'book'],
            ['arrange delivery', 'arrange'],
            ['organize files', 'organize'],
            ['plan event', 'plan'],
            ['prepare presentation', 'prepare'],
            ['write report', 'write'],
            ['draft proposal', 'draft'],
            ['create document', 'create'],
            ['check status', 'check'],
            ['verify data', 'verify'],
            ['confirm appointment', 'confirm'],
            ['send report', 'send'],
            ['share documents', 'share'],
            ['update status', 'update'],
            ['modify settings', 'modify'],
            ['delete record', 'delete'],
            ['remove file', 'remove'],
            ['add note', 'add'],
            ['text John', 'text']
        ];

        test.each(testCases)('parses "%s" to action "%s"', (input, expected) => {
            const result = parser.parse(input);
            expect(result.parsed.plugins.action?.action).toBe(expected);
        });
    });

    describe('Location Parser', () => {
        const testCases = [
            ['Meet in Building A12', { type: 'physical', building: 'A12' }],
            ['Meeting in Room 305', { type: 'physical', room: '305' }],
            ['Meet at 123 Main Street', { type: 'physical', address: '123 Main Street' }],
            ['Call on Zoom https://zoom.us/j/123456', { type: 'online', value: 'zoom', link: 'https://zoom.us/j/123456' }],
            ['Meet in the office', { type: 'office', value: 'office' }],
            ['Meeting at Floor B2', { type: 'physical', building: 'B2' }],
            ['Meet in Suite 400', { type: 'physical', room: '400' }],
            ['Meeting at 789 Park Avenue', { type: 'physical', address: '789 Park Avenue' }]
        ];

        test.each(testCases)('parses "%s" correctly', (input, expected) => {
            const result = parser.parse(input);
            expect(result.parsed.plugins.location?.location).toEqual(expected);
        });
    });

    describe('Time of Day Parser', () => {
        const testCases = [
            ['Meet at 9am', { hour: 9, minutes: 0 }],
            ['Call at 2:30pm', { hour: 14, minutes: 30 }],
            ['Meeting in the morning', { period: 'morning', start: 9, end: 12 }],
            ['Lunch in the afternoon', { period: 'afternoon', start: 12, end: 17 }],
            ['Dinner in the evening', { period: 'evening', start: 17, end: 21 }],
            ['Meet at 14:00', { hour: 14, minutes: 0 }],
            ['Call at 9:15', { hour: 9, minutes: 15 }]
        ];

        test.each(testCases)('parses "%s" correctly', (input, expected) => {
            const result = parser.parse(input);
            expect(result.parsed.plugins.timeOfDay?.timeOfDay).toEqual(expected);
        });
    });

    describe('Priority Parser', () => {
        const testCases = [
            ['Urgent meeting tomorrow', 'urgent'],
            ['High priority task', 'high'],
            ['Medium priority review', 'medium'],
            ['Low priority update', 'low'],
            ['Normal status report', 'normal'],
            ['Regular meeting', 'normal'] // default
        ];

        test.each(testCases)('parses "%s" to priority "%s"', (input, expected) => {
            const result = parser.parse(input);
            expect(result.parsed.plugins.priority?.priority).toBe(expected);
        });
    });

    describe('Status Parser', () => {
        const testCases = [
            ['Task - 50% complete', '50'],
            ['Project - 100% complete', '100'],
            ['Update - 25% complete', '25'],
            ['Review - 75% complete', '75'],
            ['Task - not started', 'None'],
            ['Task - completed', 'Complete']
        ];

        test.each(testCases)('parses "%s" correctly', (input, expected) => {
            const result = parser.parse(input);
            expect(result.parsed.plugins.status?.status).toBe(expected);
        });
    });

    describe('Tags Parser', () => {
        const testCases = [
            ['Task #work #important', ['work', 'important']],
            ['#project meeting #team', ['project', 'team']],
            ['Regular meeting', []],
            ['#one #two #three', ['one', 'two', 'three']],
            ['Complex #task-1 #feature-2', ['task-1', 'feature-2']]
        ];

        test.each(testCases)('parses "%s" correctly', (input, expected) => {
            const result = parser.parse(input);
            expect(result.parsed.plugins.tags?.tags).toEqual(expected);
        });
    });

    describe('Recurring Parser', () => {
        const testCases = [
            ['Meet every day', { type: 'daily', interval: 1 }],
            ['Call every week', { type: 'weekly', interval: 1 }],
            ['Review every month', { type: 'monthly', interval: 1 }],
            ['Sync every Monday', { type: 'specific', day: 'monday', interval: 1 }],
            ['Meeting each Wednesday', { type: 'specific', day: 'wednesday', interval: 1 }]
        ];

        test.each(testCases)('parses "%s" correctly', (input, expected) => {
            const result = parser.parse(input);
            expect(result.parsed.plugins.recurring?.recurrence).toEqual(expected);
        });
    });

    describe('Duration Parser', () => {
        const testCases = [
            ['Meeting for 2 hours', { minutes: 120, formatted: '2h0m' }],
            ['Call for 30 minutes', { minutes: 30, formatted: '0h30m' }],
            ['Session for 1 hour', { minutes: 60, formatted: '1h0m' }],
            ['Meeting for 1.5 hours', { minutes: 90, formatted: '1h30m' }],
            ['Quick 15 min call', { minutes: 15, formatted: '0h15m' }]
        ];

        test.each(testCases)('parses "%s" correctly', (input, expected) => {
            const result = parser.parse(input);
            expect(result.parsed.plugins.duration?.duration).toEqual(expected);
        });
    });

    describe('Complexity Parser', () => {
        const testCases = [
            ['Complex task review', 'complex'],
            ['Standard task update', 'standard'],
            ['Quick review needed', 'quick'],
            ['Simple task assignment', 'simple']
        ];

        test.each(testCases)('parses "%s" correctly', (input, expected) => {
            const result = parser.parse(input);
            expect(result.parsed.plugins.complexity?.complexity).toBe(expected);
        });
    });

    describe('Links Parser', () => {
        const testCases = [
            ['Check https://example.com', ['https://example.com']],
            ['Multiple links: https://test.com and http://other.org', ['https://test.com', 'http://other.org']],
            ['File link file://docs/report.pdf', ['file://docs/report.pdf']],
            ['No links here', []],
            ['Complex URL https://sub.domain.com/path?query=1#hash', ['https://sub.domain.com/path?query=1#hash']]
        ];

        test.each(testCases)('parses "%s" correctly', (input, expected) => {
            const result = parser.parse(input);
            expect(result.parsed.plugins.links?.links).toEqual(expected);
        });
    });

    describe('Attendees Parser', () => {
        const testCases = [
            ['Meeting with John', ['John']],
            ['Call with Sarah and Mike', ['Sarah', 'Mike']],
            ['Team meeting with Alice, Bob, and Charlie', ['Alice', 'Bob', 'Charlie']],
            ['Solo work', []],
            ['Meeting with the team', ['team']]
        ];

        test.each(testCases)('parses "%s" correctly', (input, expected) => {
            const result = parser.parse(input);
            expect(result.parsed.plugins.attendees?.attendees).toEqual(expected);
        });
    });

    describe('Categories Parser', () => {
        const testCases = [
            ['#work meeting', ['work']],
            ['#personal #health appointment', ['personal', 'health']],
            ['Regular meeting', []],
            ['#project #task #priority', ['project', 'task', 'priority']],
            ['#work-1 #feature-2', ['work-1', 'feature-2']]
        ];

        test.each(testCases)('parses "%s" correctly', (input, expected) => {
            const result = parser.parse(input);
            expect(result.parsed.plugins.categories?.categories).toEqual(expected);
        });
    });

    describe('Contexts Parser', () => {
        const testCases = [
            ['Client meeting', ['work']],
            ['Family dinner', ['personal']],
            ['Doctor appointment', ['health']],
            ['Team building event', ['work', 'social']],
            ['Grocery shopping', ['personal', 'shopping']]
        ];

        test.each(testCases)('parses "%s" correctly', (input, expected) => {
            const result = parser.parse(input);
            expect(result.parsed.plugins.contexts?.contexts).toEqual(expected);
        });
    });
});
