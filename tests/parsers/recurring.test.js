import recurringParser from '../../src/services/parser/parsers/recurring.js';

describe('Recurring Parser', () => {
    describe('Input Validation', () => {
        test('handles null input', () => {
            const result = recurringParser.parse(null);
            expect(confidences[1]).toBeGreaterThan(confidences[0]); // specific > basic
            expect(confidences[0]).toBeGreaterThan(confidences[2]); // basic > time
            expect(confidences[3]).toBeGreaterThan(confidences[2]); // business > time
        });

        test('increases confidence with end conditions', () => {
            const results = [
                recurringParser.parse('Task every day'),
                recurringParser.parse('Task every day for 5 times'),
                recurringParser.parse('Task every day until next month')
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(confidences[1]).toBeGreaterThan(confidences[0]);
            expect(confidences[2]).toBeGreaterThan(confidences[0]);
        });

        test('adjusts confidence based on position', () => {
            const results = [
                recurringParser.parse('Every day do task'),           // start
                recurringParser.parse('Task that happens every day'), // middle
                recurringParser.parse('Task every day')               // near start
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(confidences[0]).toBeGreaterThan(confidences[1]);
            expect(confidences[2]).toBeGreaterThan(confidences[1]);
        });
    });

    describe('Pattern Validation', () => {
        test('validates interval numbers', () => {
            const result = recurringParser.parse('Task every 0 days');
            expect(result).toBeNull();
        });

        test('validates ordinal values', () => {
            const validResult = recurringParser.parse('Meeting every first Monday');
            const invalidResult = recurringParser.parse('Meeting every zeroth Monday');
            
            expect(validResult).not.toBeNull();
            expect(invalidResult).toBeNull();
        });

        test('validates weekday names', () => {
            const validResult = recurringParser.parse('Meeting every Monday');
            const invalidResult = recurringParser.parse('Meeting every Someday');
            
            expect(validResult).not.toBeNull();
            expect(invalidResult).toBeNull();
        });
    });

    describe('Error Handling', () => {
        test('handles invalid pattern gracefully', () => {
            // Mock a pattern that would cause regex error
            const originalPatterns = { ...recurringParser.PATTERNS };
            recurringParser.PATTERNS = {
                invalid: {
                    pattern: /(?<!x)/,  // Invalid negative lookbehind
                    interval: 'day',
                    confidence: 0.9
                }
            };

            const result = recurringParser.parse('Task every day');
            expect(result).toEqual({
                type: 'error',
                error: 'PARSER_ERROR',
                message: expect.any(String)
            });

            // Restore original patterns
            recurringParser.PATTERNS = originalPatterns;
        });

        test('handles buildRecurrence errors', () => {
            // Mock buildRecurrence to throw
            const originalBuild = recurringParser.buildRecurrence;
            recurringParser.buildRecurrence = () => {
                throw new Error('Build error');
            };

            const result = recurringParser.parse('Task every day');
            expect(result).toEqual({
                type: 'error',
                error: 'PARSER_ERROR',
                message: 'Build error'
            });

            // Restore original function
            recurringParser.buildRecurrence = originalBuild;
        });

        test('handles invalid interval types', () => {
            const result = recurringParser.parse('Task every invalid');
            expect(result).toBeNull();
        });
    });

    describe('Integration Cases', () => {
        test('handles complex recurring patterns', () => {
            const result = recurringParser.parse(
                'Team meeting every second Tuesday until end of year'
            );
            expect(result).toEqual({
                type: 'recurring',
                value: {
                    type: 'ordinal',
                    ordinal: 2,
                    weekday: 'tuesday',
                    weekdayIndex: 2,
                    end: {
                        type: 'until',
                        value: 'end of year'
                    }
                },
                metadata: {
                    pattern: 'ordinal',
                    confidence: expect.any(Number),
                    originalMatch: expect.any(String),
                    includesEndCondition: true
                }
            });
        });

        test('handles multiple recurrence indicators', () => {
            const result = recurringParser.parse(
                'Stand-up every business day at 10am for 30 times'
            );
            expect(result.value).toEqual({
                type: 'business',
                interval: 1,
                excludeWeekends: true,
                end: {
                    type: 'count',
                    value: 30
                }
            });
        });
    });
});result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('handles empty string', () => {
            const result = recurringParser.parse('');
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('returns null for non-recurring text', () => {
            const result = recurringParser.parse('Regular non-recurring task');
            expect(result).toBeNull();
        });
    });

    describe('Basic Intervals', () => {
        test('parses daily recurrence', () => {
            const result = recurringParser.parse('Task occurs every day');
            expect(result).toEqual({
                type: 'recurring',
                value: {
                    type: 'day',
                    interval: 1
                },
                metadata: {
                    pattern: 'daily',
                    confidence: expect.any(Number),
                    originalMatch: 'every day',
                    includesEndCondition: false
                }
            });
        });

        test('parses weekly recurrence', () => {
            const result = recurringParser.parse('Task occurs every week');
            expect(result.value).toEqual({
                type: 'week',
                interval: 1
            });
        });

        test('parses monthly recurrence', () => {
            const result = recurringParser.parse('Task occurs every month');
            expect(result.value).toEqual({
                type: 'month',
                interval: 1
            });
        });

        test('parses yearly recurrence', () => {
            const result = recurringParser.parse('Task occurs every year');
            expect(result.value).toEqual({
                type: 'year',
                interval: 1
            });
        });
    });

    describe('Weekday Recurrence', () => {
        test('parses specific weekdays', () => {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            
            days.forEach((day, index) => {
                const result = recurringParser.parse(`Meeting every ${day}`);
                expect(result.value).toEqual({
                    type: 'specific',
                    day: day.toLowerCase(),
                    dayIndex: index === 6 ? 0 : index + 1, // Sunday is 0
                    interval: 1
                });
            });
        });

        test('handles business days', () => {
            const result = recurringParser.parse('Meeting every business day');
            expect(result.value).toEqual({
                type: 'business',
                interval: 1,
                excludeWeekends: true
            });
        });
    });

    describe('Multiple Intervals', () => {
        test('parses multiple days', () => {
            const result = recurringParser.parse('Task every 3 days');
            expect(result.value).toEqual({
                type: 'day',
                interval: 3
            });
        });

        test('parses multiple weeks', () => {
            const result = recurringParser.parse('Task every 2 weeks');
            expect(result.value).toEqual({
                type: 'week',
                interval: 2
            });
        });

        test('handles singular and plural units', () => {
            const tests = [
                ['Task every 1 day', 1],
                ['Task every 1 week', 1],
                ['Task every 2 days', 2],
                ['Task every 2 weeks', 2]
            ];

            tests.forEach(([input, expected]) => {
                const result = recurringParser.parse(input);
                expect(result.value.interval).toBe(expected);
            });
        });
    });

    describe('Time-based Recurrence', () => {
        test('parses hourly intervals', () => {
            const result = recurringParser.parse('Task every 2 hours');
            expect(result.value).toEqual({
                type: 'time',
                minutes: 120
            });
        });

        test('parses minute intervals', () => {
            const result = recurringParser.parse('Task every 30 minutes');
            expect(result.value).toEqual({
                type: 'time',
                minutes: 30
            });
        });
    });

    describe('Ordinal Recurrence', () => {
        test('parses ordinal weekdays', () => {
            const result = recurringParser.parse('Meeting every first Monday of the month');
            expect(result.value).toEqual({
                type: 'ordinal',
                ordinal: 1,
                weekday: 'monday',
                weekdayIndex: 1
            });
        });

        test('handles last weekday', () => {
            const result = recurringParser.parse('Meeting every last Friday of month');
            expect(result.value).toEqual({
                type: 'ordinal',
                ordinal: -1,
                weekday: 'friday',
                weekdayIndex: 5
            });
        });
    });

    describe('End Conditions', () => {
        test('parses count-based end', () => {
            const result = recurringParser.parse('Task every day for 5 times');
            expect(result.value.end).toEqual({
                type: 'count',
                value: 5
            });
            expect(result.metadata.includesEndCondition).toBe(true);
        });

        test('parses date-based end', () => {
            const result = recurringParser.parse('Task every week until next month');
            expect(result.value.end).toEqual({
                type: 'until',
                value: 'next month'
            });
            expect(result.metadata.includesEndCondition).toBe(true);
        });
    });

    describe('Confidence Scoring', () => {
        test('assigns higher confidence for specific patterns', () => {
            const results = [
                recurringParser.parse('Task every day'),            // basic
                recurringParser.parse('Task every Monday'),         // specific
                recurringParser.parse('Task every 2 hours'),        // time
                recurringParser.parse('Task every business day')    // business
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(
