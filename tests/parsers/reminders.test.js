import remindersParser from '../../src/services/parser/parsers/reminders.js';

describe('Reminders Parser', () => {
    describe('Input Validation', () => {
        test('handles null input', () => {
            const result = remindersParser.parse(null);
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('handles empty string', () => {
            const result = remindersParser.parse('');
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('returns null for text without reminders', () => {
            const result = remindersParser.parse('Regular text without reminders');
            expect(result).toBeNull();
        });
    });

    describe('Relative Time Reminders', () => {
        test('parses minute-based reminders', () => {
            const result = remindersParser.parse('remind me 30 minutes before');
            expect(result).toEqual({
                type: 'reminders',
                value: [{
                    type: 'relative',
                    minutes: 30,
                    originalValue: '30 minutes',
                    beforeEvent: true
                }],
                metadata: {
                    pattern: 'relative',
                    confidence: expect.any(Number),
                    count: 1,
                    types: ['relative']
                }
            });
        });

        test('parses hour-based reminders', () => {
            const result = remindersParser.parse('remind me 2 hours before');
            expect(result.value[0]).toEqual({
                type: 'relative',
                minutes: 120,
                originalValue: '2 hours',
                beforeEvent: true
            });
        });

        test('handles abbreviated time units', () => {
            const cases = [
                ['30 mins', 30],
                ['2 hrs', 120],
                ['1 hr', 60]
            ];

            cases.forEach(([input, expected]) => {
                const result = remindersParser.parse(`remind me ${input} before`);
                expect(result.value[0].minutes).toBe(expected);
            });
        });
    });

    describe('Absolute Time Reminders', () => {
        test('parses specific times', () => {
            const result = remindersParser.parse('remind me at 2:30pm');
            expect(result.value[0]).toEqual({
                type: 'absolute',
                time: {
                    hours: 14,
                    minutes: 30
                },
                originalValue: expect.stringContaining('2:30pm')
            });
        });

        test('handles 24-hour format', () => {
            const result = remindersParser.parse('remind me at 14:30');
            expect(result.value[0].time).toEqual({
                hours: 14,
                minutes: 30
            });
        });

        test('converts 12-hour format correctly', () => {
            const cases = [
                ['9:00am', 9],
                ['9:00pm', 21],
                ['12:00pm', 12],
                ['12:00am', 0]
            ];

            cases.forEach(([input, expectedHours]) => {
                const result = remindersParser.parse(`remind me at ${input}`);
                expect(result.value[0].time.hours).toBe(expectedHours);
            });
        });
    });

    describe('Multiple Reminders', () => {
        test('parses multiple time intervals', () => {
            const result = remindersParser.parse('remind me 1 hour and 30 minutes before');
            expect(result.value).toHaveLength(2);
            expect(result.value[0].minutes).toBe(60);
            expect(result.value[1].minutes).toBe(30);
        });

        test('consolidates reminders in order', () => {
            const result = remindersParser.parse('remind me 10 minutes and 1 hour before');
            const minutes = result.value.map(r => r.minutes);
            expect(minutes).toEqual([60, 10]); // Should be sorted descending
        });

        test('handles comma-separated reminders', () => {
            const result = remindersParser.parse('remind me 2 hours, 1 hour and 30 minutes before');
            expect(result.value).toHaveLength(3);
            expect(result.metadata.count).toBe(3);
        });
    });

    describe('Day-based Reminders', () => {
        test('parses day references', () => {
            const result = remindersParser.parse('remind me on Monday');
            expect(result.value[0]).toEqual({
                type: 'day',
                value: 'Monday',
                originalValue: expect.stringContaining('Monday')
            });
        });

        test('handles relative day references', () => {
            const result = remindersParser.parse('remind me tomorrow');
            expect(result.value[0]).toEqual({
                type: 'day',
                value: 'tomorrow',
                originalValue: expect.stringContaining('tomorrow')
            });
        });
    });

    describe('General Reminders', () => {
        test('captures general reminder requests', () => {
            const result = remindersParser.parse('please remind me about this');
            expect(result.value[0]).toEqual({
                type: 'general',
                value: true,
                originalValue: expect.stringContaining('remind me')
            });
        });
    });

    describe('Confidence Scoring', () => {
        test('assigns higher confidence to specific times', () => {
            const results = [
                remindersParser.parse('remind me'),
                remindersParser.parse('remind me tomorrow'),
                remindersParser.parse('remind me at 2:30pm')
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(confidences[2]).toBeGreaterThan(confidences[1]);
            expect(confidences[1]).toBeGreaterThan(confidences[0]);
        });

        test('increases confidence for multiple reminders', () => {
            const single = remindersParser.parse('remind me 30 minutes before');
            const multiple = remindersParser.parse('remind me 1 hour and 30 minutes before');
            expect(multiple.metadata.confidence).toBeGreaterThan(single.metadata.confidence);
        });

        test('adjusts confidence based on precision', () => {
            const results = [
                remindersParser.parse('remind me 1 hour before'),
                remindersParser.parse('remind me 30 minutes before')
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(confidences[1]).toBeGreaterThan(confidences[0]);
        });
    });

    describe('Error Handling', () => {
        test('handles invalid time values', () => {
            const result = remindersParser.parse('remind me -30 minutes before');
            expect(result).toBeNull();
        });

        test('handles time conversion errors', () => {
            // Mock convertToMinutes to throw
            const originalConvert = remindersParser.convertToMinutes;
            remindersParser.convertToMinutes = () => {
                throw new Error('Conversion error');
            };

            const result = remindersParser.parse('remind me 30 minutes before');
            expect(result).toEqual({
                type: 'error',
                error: 'PARSER_ERROR',
                message: 'Conversion error'
            });

            // Restore original function
            remindersParser.convertToMinutes = originalConvert;
        });

        test('handles consolidation errors gracefully', () => {
            // Mock consolidateReminders to throw
            const originalConsolidate = remindersParser.consolidateReminders;
            remindersParser.consolidateReminders = () => {
                throw new Error('Consolidation error');
            };

            const result = remindersParser.parse('remind me 1 hour and 30 minutes before');
            expect(result).toEqual({
                type: 'error',
                error: 'PARSER_ERROR',
                message: 'Consolidation error'
            });

            // Restore original function
            remindersParser.consolidateReminders = originalConsolidate;
        });
    });

    describe('Edge Cases', () => {
        test('handles zero time values', () => {
            const result = remindersParser.parse('remind me 0 minutes before');
            expect(result).toBeNull();
        });

        test('handles extremely large time values', () => {
            const result = remindersParser.parse('remind me 1000000 hours before');
            expect(result).toBeNull();
        });

        test('handles duplicated time references', () => {
            const result = remindersParser.parse('remind me 30 minutes before and 30 minutes before');
            expect(result.value).toHaveLength(1); // Should deduplicate
            expect(result.value[0].minutes).toBe(30);
        });

        test('handles overlapping patterns', () => {
            const result = remindersParser.parse('remind me at 2pm and 2 hours before');
            expect(result.value).toHaveLength(2);
            expect(result.value.map(r => r.type)).toEqual(['absolute', 'relative']);
        });

        test('handles missing time units', () => {
            const result = remindersParser.parse('remind me 30 before');
            expect(result).toBeNull();
        });

        test('handles invalid time formats', () => {
            const invalidFormats = [
                'remind me at 25:00',    // Invalid hour
                'remind me at 10:60',    // Invalid minute
                'remind me at 2:30xx'    // Invalid period
            ];

            invalidFormats.forEach(input => {
                const result = remindersParser.parse(input);
                expect(result).toBeNull();
            });
        });
    });

    describe('Time Unit Conversion', () => {
        test('converts all supported time units', () => {
            const conversions = [
                ['30 minutes', 30],
                ['1 hour', 60],
                ['2 hours', 120],
                ['1 day', 1440],
                ['2 days', 2880]
            ];

            conversions.forEach(([input, expected]) => {
                const result = remindersParser.parse(`remind me ${input} before`);
                expect(result.value[0].minutes).toBe(expected);
            });
        });

        test('handles mixed units', () => {
            const result = remindersParser.parse('remind me 1 hour and 30 minutes before');
            const totalMinutes = result.value.reduce((sum, r) => sum + r.minutes, 0);
            expect(totalMinutes).toBe(90);
        });

        test('handles unit variations', () => {
            const variations = [
                'min',
                'mins',
                'minute',
                'minutes',
                'hr',
                'hrs',
                'hour',
                'hours'
            ];

            variations.forEach(unit => {
                const result = remindersParser.parse(`remind me 1 ${unit} before`);
                expect(result).not.toBeNull();
                expect(result.value[0].minutes).toBeGreaterThan(0);
            });
        });
    });

    describe('Context and Position', () => {
        test('handles reminders at start of text', () => {
            const result = remindersParser.parse('remind me at 2pm about the meeting');
            expect(result).not.toBeNull();
            expect(result.metadata.confidence).toBeLessThan(0.95); // Lower confidence for start position
        });

        test('handles reminders at end of text', () => {
            const result = remindersParser.parse('about the meeting, remind me at 2pm');
            expect(result).not.toBeNull();
            expect(result.metadata.confidence).toBeGreaterThan(0.85); // Higher confidence for end position
        });

        test('handles multiple reminder phrases', () => {
            const result = remindersParser.parse('remind me at 2pm and also remind me 30 minutes before');
            expect(result.value).toHaveLength(2);
            expect(result.value.map(r => r.type)).toEqual(['absolute', 'relative']);
        });
    });

    describe('Pattern Integration', () => {
        test('recognizes all reminder formats in one text', () => {
            const result = remindersParser.parse(
                'remind me tomorrow at 2pm, 1 hour before, and 30 minutes before'
            );
            
            expect(result.value).toHaveLength(3);
            expect(result.value.map(r => r.type)).toEqual(['day', 'relative', 'relative']);
            expect(result.metadata.types).toEqual(expect.arrayContaining(['day', 'relative']));
        });

        test('maintains correct reminder order', () => {
            const result = remindersParser.parse(
                'remind me 30 minutes before, at 2pm, and 1 hour before'
            );

            const values = result.value;
            expect(values[0].type).toBe('absolute'); // Time-specific reminders first
            expect(values[1].minutes).toBe(60);      // Then longer durations
            expect(values[2].minutes).toBe(30);      // Then shorter durations
        });

        test('handles complex reminder combinations', () => {
            const result = remindersParser.parse(
                'remind me tomorrow at 2pm, then 1 hour, 30 minutes, and 15 minutes before'
            );

            expect(result.value).toHaveLength(4);
            expect(result.metadata.count).toBe(4);
            expect(result.metadata.pattern).toBe('multiple');
            expect(result.metadata.types).toEqual(expect.arrayContaining(['day', 'relative']));
        });
    });
});
