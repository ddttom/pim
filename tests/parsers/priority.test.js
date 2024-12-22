import priorityParser from '../../src/services/parser/parsers/priority.js';

describe('Priority Parser', () => {
    describe('Input Validation', () => {
        test('handles null input', () => {
            const result = priorityParser.parse(null);
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('handles empty string', () => {
            const result = priorityParser.parse('');
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });
    });

    describe('Explicit Priority', () => {
        test('parses explicit priority statements', () => {
            const result = priorityParser.parse('This is high priority task');
            expect(result).toEqual({
                type: 'priority',
                value: 'high',
                metadata: {
                    pattern: 'explicit',
                    confidence: 0.9,
                    originalMatch: 'high priority'
                }
            });
        });

        test('handles different priority levels', () => {
            const cases = [
                ['high priority', 'high'],
                ['medium priority', 'medium'],
                ['low priority', 'low'],
                ['normal priority', 'normal']
            ];

            cases.forEach(([input, expected]) => {
                const result = priorityParser.parse(input);
                expect(result.value).toBe(expected);
                expect(result.metadata.confidence).toBe(0.9);
            });
        });
    });

    describe('Shorthand Notation', () => {
        test('parses exclamation mark notation', () => {
            const cases = [
                ['Task !!!', 'high'],
                ['Task !!', 'medium'],
                ['Task !', 'low']
            ];

            cases.forEach(([input, expected]) => {
                const result = priorityParser.parse(input);
                expect(result.value).toBe(expected);
                expect(result.metadata.pattern).toBe('shorthand');
            });
        });

        test('parses P-notation', () => {
            const cases = [
                ['p1 Task', 'high'],
                ['p2 Task', 'medium'],
                ['p3 Task', 'low']
            ];

            cases.forEach(([input, expected]) => {
                const result = priorityParser.parse(input);
                expect(result.value).toBe(expected);
                expect(result.metadata.pattern).toBe('shorthand');
            });
        });
    });

    describe('Urgency Indicators', () => {
        test('identifies urgent tasks', () => {
            const result = priorityParser.parse('Need this ASAP');
            expect(result).toEqual({
                type: 'priority',
                value: 'high',
                metadata: {
                    pattern: 'urgent',
                    confidence: expect.any(Number),
                    originalMatch: 'ASAP',
                    indicators: expect.any(Array)
                }
            });
        });

        test('recognizes important tasks', () => {
            const result = priorityParser.parse('This is critical');
            expect(result.value).toBe('high');
            expect(result.metadata.pattern).toBe('important');
        });
    });

    describe('Time-based Urgency', () => {
        test('recognizes deadline-based priority', () => {
            const result = priorityParser.parse('Due by end of today');
            expect(result.value).toBe('high');
            expect(result.metadata.pattern).toBe('deadline');
        });

        test('handles various deadline formats', () => {
            const cases = [
                'due today',
                'by end of week',
                'before tomorrow',
                'due close of day'
            ];

            cases.forEach(input => {
                const result = priorityParser.parse(input);
                expect(result.value).toBe('high');
                expect(result.metadata.pattern).toBe('deadline');
            });
        });
    });

    describe('Low Priority Indicators', () => {
        test('identifies low priority tasks', () => {
            const result = priorityParser.parse('Can be done whenever');
            expect(result.value).toBe('low');
            expect(result.metadata.pattern).toBe('low');
        });

        test('recognizes normal priority tasks', () => {
            const result = priorityParser.parse('Regular weekly task');
            expect(result.value).toBe('normal');
            expect(result.metadata.pattern).toBe('normal');
        });
    });

    describe('Context-based Priority', () => {
        test('derives priority from multiple indicators', () => {
            const result = priorityParser.parse('Client needs this for tomorrow');
            expect(result.metadata.indicators).toContain('stakeholder');
            expect(result.metadata.indicators).toContain('time_pressure');
            expect(result.value).toBe('high');
        });

        test('considers impact indicators', () => {
            const result = priorityParser.parse('This is blocking other tasks');
            expect(result.metadata.indicators).toContain('impact');
            expect(result.value).toBe('medium');
        });

        test('recognizes low effort tasks', () => {
            const result = priorityParser.parse('Quick and simple task');
            expect(result.metadata.indicators).toContain('low_effort');
            expect(result.value).toBe('low');
        });
    });

    describe('Confidence Scoring', () => {
        test('adjusts confidence based on exclamation marks', () => {
            const result = priorityParser.parse('Urgent task!!!');
            expect(result.metadata.confidence).toBeGreaterThan(0.8);
        });

        test('considers pattern repetition', () => {
            const result = priorityParser.parse('Urgent urgent task');
            expect(result.metadata.confidence).toBeGreaterThan(0.8);
        });

        test('factors in position', () => {
            const result = priorityParser.parse('URGENT: task details');
            expect(result.metadata.confidence).toBeGreaterThan(0.8);
        });
    });
});
