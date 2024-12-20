import parser from '../src/services/parser.js';
import { jest } from '@jest/globals';

describe('Parser Tests', () => {
    beforeEach(() => {
        parser.resetPlugins();
    });

    describe('Status Parsing', () => {
        test('should default to None status', () => {
            const result = parser.parse('Call John');
            expect(result.parsed.status).toBe('None');
        });

        test('should parse Blocked status', () => {
            const result = parser.parse('Call John - blocked by network issues');
            expect(result.parsed.status).toBe('Blocked');
        });

        test('should parse Complete status', () => {
            const result = parser.parse('Call John - complete');
            expect(result.parsed.status).toBe('Complete');
        });

        test('should parse Started status', () => {
            const result = parser.parse('Call John - started');
            expect(result.parsed.status).toBe('Started');
        });

        test('should parse Closed status', () => {
            const result = parser.parse('Call John - closed');
            expect(result.parsed.status).toBe('Closed');
        });

        test('should parse Abandoned status', () => {
            const result = parser.parse('Call John - abandoned');
            expect(result.parsed.status).toBe('Abandoned');
        });
    });

    describe('Date Parsing', () => {
        beforeAll(() => {
            // Mock Date to have consistent test results
            jest.useFakeTimers();
            jest.setSystemTime(new Date('2024-01-01'));
        });

        afterAll(() => {
            jest.useRealTimers();
        });

        test('should parse "next week"', () => {
            const result = parser.parse('Call John next week');
            expect(result.parsed.final_deadline).toBe('2024-01-08T09:00:00.000Z');
        });

        test('should set time to 9 AM when no time specified', () => {
            const result = parser.parse('Meet Sarah tomorrow');
            expect(result.parsed.final_deadline).toBe('2024-01-02T09:00:00.000Z');
        });

        test('should handle "now" keyword', () => {
            const result = parser.parse('Call John now');
            expect(result.parsed.final_deadline).toBe('2024-01-01T12:00:00.000Z');
        });
    });

    describe('Action Parsing', () => {
        test('should parse call action', () => {
            const result = parser.parse('Call John');
            expect(result.parsed.action).toBe('call');
        });

        test('should parse text action', () => {
            const result = parser.parse('Text Sarah');
            expect(result.parsed.action).toBe('text');
        });

        test('should parse meet action', () => {
            const result = parser.parse('Meet with team');
            expect(result.parsed.action).toBe('meet');
        });

        test('should handle action at start of text', () => {
            const result = parser.parse('email John about project');
            expect(result.parsed.action).toBe('email');
        });
    });

    describe('Project Parsing', () => {
        test('should parse project from "about project" format', () => {
            const result = parser.parse('Call John about Project Cheesecake');
            expect(result.parsed.project.project).toBe('Project Cheesecake');
        });

        test('should parse project from "Project X" format', () => {
            const result = parser.parse('Project Alpha meeting tomorrow');
            expect(result.parsed.project.project).toBe('Project Alpha');
        });

        test('should handle multi-word project names', () => {
            const result = parser.parse('about Project Big Launch');
            expect(result.parsed.project.project).toBe('Project Big Launch');
        });

        test('should handle project names with mixed case', () => {
            const result = parser.parse('Call about Project CheeseCake');
            expect(result.parsed.project.project).toBe('Project CheeseCake');
        });
    });

    describe('Contact Parsing', () => {
        test('should parse contact after action', () => {
            const result = parser.parse('Call John about project');
            expect(result.parsed.contact).toBe('John');
        });

        test('should parse contact after with', () => {
            const result = parser.parse('Meeting with Sarah tomorrow');
            expect(result.parsed.contact).toBe('Sarah');
        });

        test('should not parse common words as contacts', () => {
            const result = parser.parse('Call me later');
            expect(result.parsed.contact).toBeUndefined();
        });
    });

    describe('Full Text Parsing', () => {
        test('should parse complex entry with multiple components', () => {
            const result = parser.parse('Call John about project Cheesecake next week - started');
            
            expect(result.parsed.action).toBe('call');
            expect(result.parsed.contact).toBe('John');
            expect(result.parsed.project.project).toBe('Project Cheesecake');
            expect(result.parsed.status).toBe('Started');
            expect(result.parsed.final_deadline).toBe('2024-01-08T09:00:00.000Z');
        });

        test('should handle empty input', () => {
            const result = parser.parse('');
            expect(result.raw_content).toBe('');
            expect(result.parsed.status).toBe('None');
        });

        test('should handle null input', () => {
            const result = parser.parse(null);
            expect(result.raw_content).toBe('');
            expect(result.parsed.status).toBe('None');
        });
    });
});

describe('Parser Facet Tests', () => {
    beforeEach(() => {
        parser.resetPlugins();
    });

    describe('Links Parsing', () => {
        test('parses web links', () => {
            const text = 'Check https://example.com and http://test.org';
            const result = parser.parse(text);
            expect(result.parsed.links).toEqual([
                'https://example.com',
                'http://test.org'
            ]);
        });

        test('parses file links', () => {
            const text = 'See file://docs/report.pdf and file://images/diagram.png';
            const result = parser.parse(text);
            expect(result.parsed.links).toEqual([
                'file://docs/report.pdf',
                'file://images/diagram.png'
            ]);
        });
    });

    describe('Participants Parsing', () => {
        test('extracts multiple participants', () => {
            const text = 'Meeting with @john @sarah and @mike';
            const result = parser.parse(text);
            expect(result.parsed.participants).toEqual(['john', 'sarah', 'mike']);
        });

        test('handles duplicate participants', () => {
            const text = 'Call @john and @john again';
            const result = parser.parse(text);
            expect(result.parsed.participants).toEqual(['john']);
        });
    });

    describe('Location Parsing', () => {
        test('parses "at" locations', () => {
            const text = 'Meet at Coffee Shop';
            const result = parser.parse(text);
            expect(result.parsed.location).toEqual({
                type: 'location',
                value: 'Coffee Shop'
            });
        });

        test('parses "in" locations', () => {
            const text = 'Meeting in Conference Room B';
            const result = parser.parse(text);
            expect(result.parsed.location).toEqual({
                type: 'location',
                value: 'Conference Room B'
            });
        });

        test('parses location with colon', () => {
            const text = 'Team sync location: Main Office';
            const result = parser.parse(text);
            expect(result.parsed.location).toEqual({
                type: 'location',
                value: 'Main Office'
            });
        });
    });

    describe('Duration Parsing', () => {
        test('parses hour durations', () => {
            const text = 'Meeting for 2 hours';
            const result = parser.parse(text);
            expect(result.parsed.duration).toEqual({
                minutes: 120,
                formatted: '2h0m'
            });
        });

        test('parses minute durations', () => {
            const text = 'Call for 45 minutes';
            const result = parser.parse(text);
            expect(result.parsed.duration).toEqual({
                minutes: 45,
                formatted: '0h45m'
            });
        });

        test('handles abbreviated units', () => {
            const text = 'Meeting for 1 hr and call for 30 min';
            const result = parser.parse(text);
            expect(result.parsed.duration).toEqual({
                minutes: 60,
                formatted: '1h0m'
            });
        });
    });

    describe('Recurrence Parsing', () => {
        test('parses daily recurrence', () => {
            const text = 'Standup every day at 10am';
            const result = parser.parse(text);
            expect(result.parsed.recurrence).toEqual({
                type: 'daily',
                interval: 1
            });
        });

        test('parses weekly recurrence', () => {
            const text = 'Team sync every week';
            const result = parser.parse(text);
            expect(result.parsed.recurrence).toEqual({
                type: 'weekly',
                interval: 1
            });
        });

        test('parses specific day recurrence', () => {
            const text = 'Meeting every monday';
            const result = parser.parse(text);
            expect(result.parsed.recurrence).toEqual({
                type: 'specific',
                day: 'monday',
                interval: 1
            });
        });
    });

    describe('Context Detection', () => {
        test('detects work context', () => {
            const text = 'Client meeting about project deadline';
            const result = parser.parse(text);
            expect(result.parsed.contexts).toContain('work');
        });

        test('detects personal context', () => {
            const text = 'Family birthday party at home';
            const result = parser.parse(text);
            expect(result.parsed.contexts).toContain('personal');
        });

        test('detects multiple contexts', () => {
            const text = 'Doctor appointment and client meeting';
            const result = parser.parse(text);
            expect(result.parsed.contexts).toEqual(
                expect.arrayContaining(['health', 'work'])
            );
        });
    });
});
