import dateParser from '../../src/services/parser/parsers/date.js';
import { jest } from '@jest/globals';

describe('Date Parser', () => {
    let now;

    beforeEach(() => {
        // Fix the current date for consistent testing
        now = new Date('2024-01-01T12:00:00.000Z');
        jest.useFakeTimers();
        jest.setSystemTime(now);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('Input Validation', () => {
        test('handles null input', () => {
            const result = dateParser.parse(null);
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('handles empty string', () => {
            const result = dateParser.parse('');
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('handles non-string input', () => {
            const result = dateParser.parse(123);
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });
    });

    describe('Absolute Dates', () => {
        test('parses ISO format dates', () => {
            const result = dateParser.parse('Meeting on 2024-02-15');
            expect(result).toEqual({
                type: 'date',
                value: '2024-02-15T00:00:00.000Z',
                metadata: {
                    pattern: 'iso',
                    confidence: 0.9,
                    hasTime: false
                }
            });
        });

        test('parses short format dates', () => {
            const result = dateParser.parse('Meeting on 15/02/2024');
            expect(result).toEqual({
                type: 'date',
                value: '2024-02-15T00:00:00.000Z',
                metadata: {
                    pattern: 'short',
                    confidence: 0.8,
                    hasTime: false
                }
            });
        });

        test('handles two-digit years', () => {
            const result = dateParser.parse('Meeting on 15/02/24');
            expect(result).toEqual({
                type: 'date',
                value: '2024-02-15T00:00:00.000Z',
                metadata: {
                    pattern: 'short',
                    confidence: 0.8,
                    hasTime: false
                }
            });
        });
    });

    describe('Relative Dates', () => {
        test('handles "today"', () => {
            const result = dateParser.parse('Meeting today');
            expect(result).toEqual({
                type: 'date',
                value: '2024-01-01T00:00:00.000Z',
                metadata: {
                    pattern: 'today',
                    confidence: 0.7,
                    hasTime: false
                }
            });
        });

        test('handles "tomorrow"', () => {
            const result = dateParser.parse('Meeting tomorrow');
            expect(result).toEqual({
                type: 'date',
                value: '2024-01-02T00:00:00.000Z',
                metadata: {
                    pattern: 'tomorrow',
                    confidence: 0.7,
                    hasTime: false
                }
            });
        });

        test('handles "next week"', () => {
            const result = dateParser.parse('Meeting next week');
            expect(result).toEqual({
                type: 'date',
                value: '2024-01-08T00:00:00.000Z',
                metadata: {
                    pattern: 'nextWeek',
                    confidence: 0.7,
                    hasTime: false
                }
            });
        });
    });

    describe('Weekday References', () => {
        test('handles "next Monday"', () => {
            const result = dateParser.parse('Meeting next Monday');
            expect(result).toEqual({
                type: 'date',
                value: '2024-01-08T00:00:00.000Z',
                metadata: {
                    pattern: 'weekday',
                    confidence: 0.7,
                    hasTime: false
                }
            });
        });

        test('handles unqualified weekday', () => {
            const result = dateParser.parse('Meeting Friday');
            expect(result).toEqual({
                type: 'date',
                value: '2024-01-05T00:00:00.000Z',
                metadata: {
                    pattern: 'weekday',
                    confidence: 0.7,
                    hasTime: false
                }
            });
        });
    });

    describe('Time Integration', () => {
        test('handles specific time', () => {
            const result = dateParser.parse('Meeting tomorrow at 2:30pm');
            expect(result).toEqual({
                type: 'date',
                value: '2024-01-02T14:30:00.000Z',
                metadata: {
                    pattern: 'tomorrow',
                    confidence: 0.8,
                    hasTime: true
                }
            });
        });

        test('handles period of day', () => {
            const result = dateParser.parse('Meeting tomorrow morning');
            expect(result).toEqual({
                type: 'date',
                value: '2024-01-02T09:00:00.000Z',
                metadata: {
                    pattern: 'tomorrow',
                    confidence: 0.7,
                    hasTime: true
                }
            });
        });
    });

    describe('Error Handling', () => {
        test('handles invalid dates', () => {
            const result = dateParser.parse('Meeting on 2024-13-45');
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_DATE',
                message: 'Failed to parse valid date'
            });
        });

        test('returns null for no date found', () => {
            const result = dateParser.parse('Regular meeting');
            expect(result).toBeNull();
        });
    });
});
