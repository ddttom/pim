import { name, parse } from '../../src/services/parser/parsers/date.js';
import { jest } from '@jest/globals';

describe('Date Parser', () => {
    let now;

    beforeEach(() => {
        now = new Date('2024-01-01T12:00:00.000Z');
        jest.useFakeTimers();
        jest.setSystemTime(now);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

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

        test('returns null for text without dates', async () => {
            const result = await parse('Regular text without dates');
            expect(result).toBeNull();
        });
    });

    describe('ISO Format', () => {
        test('parses ISO dates', async () => {
            const result = await parse('Meeting on 2024-02-15');
            expect(result).toEqual({
                type: 'date',
                value: '2024-02-15',
                metadata: {
                    pattern: 'iso',
                    confidence: expect.any(Number),
                    originalMatch: '2024-02-15',
                    format: 'iso'
                }
            });
        });

        test('handles invalid ISO dates', async () => {
            const result = await parse('Meeting on 2024-13-45');
            expect(result).toBeNull();
        });
    });

    describe('Natural Format', () => {
        test('parses natural dates', async () => {
            const result = await parse('Meeting on January 15th, 2024');
            expect(result.value).toBe('2024-01-15');
            expect(result.metadata.format).toBe('natural');
        });

        test('handles abbreviated months', async () => {
            const result = await parse('Meeting on Jan 15, 2024');
            expect(result.value).toBe('2024-01-15');
        });

        test('handles various ordinal suffixes', async () => {
            const inputs = ['1st', '2nd', '3rd', '4th'];
            await Promise.all(inputs.map(async (day) => {
                const result = await parse(`Meeting on January ${day}, 2024`);
                expect(result.value).toBe(`2024-01-0${day[0]}`);
            }));
        });
    });

    describe('Relative Dates', () => {
        test('handles today', async () => {
            const result = await parse('Due today');
            expect(result.value).toBe('2024-01-01');
            expect(result.metadata.format).toBe('relative');
        });

        test('handles tomorrow', async () => {
            const result = await parse('Due tomorrow');
            expect(result.value).toBe('2024-01-02');
        });

        test('handles yesterday', async () => {
            const result = await parse('Due yesterday');
            expect(result.value).toBe('2023-12-31');
        });
    });

    describe('Deadline Format', () => {
        test('parses due dates', async () => {
            const result = await parse('Task due: January 15, 2024');
            expect(result.value).toBe('2024-01-15');
            expect(result.metadata.format).toBe('deadline');
        });

        test('handles various due formats', async () => {
            const formats = [
                'due: Jan 15 2024',
                'due Jan 15 2024',
                'due:Jan 15 2024'
            ];
            await Promise.all(formats.map(async (format) => {
                const result = await parse(format);
                expect(result.value).toBe('2024-01-15');
            }));
        });
    });

    describe('Scheduled Format', () => {
        test('parses scheduled dates', async () => {
            const result = await parse('Task scheduled: January 15, 2024');
            expect(result.value).toBe('2024-01-15');
            expect(result.metadata.format).toBe('scheduled');
        });

        test('handles various scheduled formats', async () => {
            const formats = [
                'scheduled: Jan 15 2024',
                'scheduled Jan 15 2024',
                'scheduled:Jan 15 2024'
            ];
            await Promise.all(formats.map(async (format) => {
                const result = await parse(format);
                expect(result.value).toBe('2024-01-15');
            }));
        });
    });

    describe('Error Handling', () => {
        test('handles invalid dates gracefully', async () => {
            const result = await parse('Meeting on February 30, 2024');
            expect(result).toBeNull();
        });

        test('handles malformed dates', async () => {
            const result = await parse('Meeting on Jxn 15, 2024');
            expect(result).toBeNull();
        });
    });

    describe('Confidence Scoring', () => {
        test('assigns higher confidence to ISO format', async () => {
            const results = [
                await parse('2024-01-15'),
                await parse('January 15, 2024'),
                await parse('today')
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(confidences[0]).toBeGreaterThan(confidences[1]);
            expect(confidences[1]).toBeGreaterThan(confidences[2]);
        });

        test('adjusts confidence based on position', async () => {
            const results = [
                await parse('2024-01-15 meeting'),
                await parse('Meeting on 2024-01-15')
            ];

            expect(results[0].metadata.confidence)
                .toBeGreaterThan(results[1].metadata.confidence);
        });
    });
});
