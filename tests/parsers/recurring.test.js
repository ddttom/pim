import { name, parse } from '../../src/services/parser/parsers/recurring.js';

describe('Recurring Parser', () => {
    describe('Input Validation', () => {
        test('handles null input', async () => {
            const result = await parse(null);
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('handles empty string', async () => {
            const result = await parse('');
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('returns null for non-recurring text', async () => {
            const result = await parse('Regular non-recurring task');
            expect(result).toBeNull();
        });
    });

    describe('Basic Intervals', () => {
        test('parses daily recurrence', async () => {
            const result = await parse('Task every day');
            expect(result).toEqual({
                type: 'recurring',
                value: {
                    type: 'day',
                    interval: 1,
                    end: null
                },
                metadata: {
                    pattern: 'daily',
                    confidence: expect.any(Number),
                    originalMatch: 'every day',
                    includesEndCondition: false
                }
            });
        });

        test('parses weekly recurrence', async () => {
            const result = await parse('Task every week');
            expect(result.value).toEqual({
                type: 'week',
                interval: 1,
                end: null
            });
        });

        test('parses monthly recurrence', async () => {
            const result = await parse('Task every month');
            expect(result.value).toEqual({
                type: 'month',
                interval: 1,
                end: null
            });
        });
    });

    describe('Specific Days', () => {
        test('parses weekday recurrence', async () => {
            const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            
            for (const [index, day] of weekdays.entries()) {
                const result = await parse(`Task every ${day}`);
                expect(result.value).toEqual({
                    type: 'specific',
                    day: day.toLowerCase(),
                    dayIndex: index === 6 ? 0 : index + 1,
                    interval: 1,
                    end: null
                });
            }
        });

        test('parses business days', async () => {
            const result = await parse('Task every business day');
            expect(result.value).toEqual({
                type: 'business',
                interval: 1,
                excludeWeekends: true,
                end: null
            });
        });
    });

    describe('Custom Intervals', () => {
        test('parses numeric intervals', async () => {
            const result = await parse('Task every 2 weeks');
            expect(result.value).toEqual({
                type: 'week',
                interval: 2,
                end: null
            });
        });

        test('handles invalid intervals', async () => {
            const result = await parse('Task every 0 days');
            expect(result).toEqual({
                type: 'error',
                error: 'PARSER_ERROR',
                message: 'Invalid interval value'
            });
        });
    });

    describe('End Conditions', () => {
        test('parses count-based end', async () => {
            const result = await parse('Task every day for 5 times');
            expect(result.value.end).toEqual({
                type: 'count',
                value: 5
            });
            expect(result.metadata.includesEndCondition).toBe(true);
        });

        test('parses date-based end', async () => {
            const result = await parse('Task every week until next month');
            expect(result.value.end).toEqual({
                type: 'until',
                value: 'next month'
            });
            expect(result.metadata.includesEndCondition).toBe(true);
        });
    });

    describe('Confidence Scoring', () => {
        test('assigns higher confidence to specific patterns', async () => {
            const results = [
                await parse('Task every day'),
                await parse('Task every Monday'),
                await parse('Task every 2 hours'),
                await parse('Task every business day')
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(confidences[1]).toBeGreaterThan(confidences[0]);
            expect(confidences[3]).toBeGreaterThan(confidences[2]);
        });

        test('increases confidence with end conditions', async () => {
            const withEnd = await parse('Task every day for 5 times');
            const withoutEnd = await parse('Task every day');
            expect(withEnd.metadata.confidence)
                .toBeGreaterThan(withoutEnd.metadata.confidence);
        });

        test('adjusts confidence based on position', async () => {
            const atStart = await parse('Every day do task');
            const inMiddle = await parse('Task happens every day');
            expect(atStart.metadata.confidence)
                .toBeGreaterThan(inMiddle.metadata.confidence);
        });
    });

    describe('Error Handling', () => {
        test('handles invalid patterns gracefully', async () => {
            const result = await parse('Task every invalid time');
            expect(result).toBeNull();
        });

        test('handles parser errors', async () => {
            const result = await parse('Task every -1 days');
            expect(result).toEqual({
                type: 'error',
                error: 'PARSER_ERROR',
                message: expect.any(String)
            });
        });
    });
});
