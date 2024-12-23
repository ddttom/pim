import { name, parse } from '../../src/services/parser/parsers/tags.js';

describe('Tags Parser', () => {
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

        test('returns null for text without tags', async () => {
            const result = await parse('Regular text without tags');
            expect(result).toBeNull();
        });
    });

    describe('Tag Formats', () => {
        test('parses hashtags', async () => {
            const result = await parse('#frontend #backend');
            expect(result.value).toContain('frontend');
            expect(result.value).toContain('backend');
            expect(result.metadata.pattern).toBe('multiple');
        });

        test('parses category tags', async () => {
            const result = await parse('+feature +bugfix');
            expect(result.value).toContain('feature');
            expect(result.value).toContain('bugfix');
        });

        test('parses topic tags', async () => {
            const result = await parse('@ui @api');
            expect(result.value).toContain('ui');
            expect(result.value).toContain('api');
        });

        test('parses inline tags', async () => {
            const result = await parse('[frontend] [backend]');
            expect(result.value).toContain('frontend');
            expect(result.value).toContain('backend');
        });
    });

    describe('Tag Categories', () => {
        test('categorizes known tags', async () => {
            const result = await parse('#feature #frontend #critical');
            expect(result.metadata.categorized).toEqual({
                type: ['feature'],
                component: ['frontend'],
                priority: ['critical']
            });
        });

        test('handles unknown tags', async () => {
            const result = await parse('#customtag');
            expect(Object.values(result.metadata.categorized)
                .every(arr => !arr.includes('customtag'))).toBe(true);
        });
    });

    describe('Tag Hierarchy', () => {
        test('builds tag hierarchy', async () => {
            const result = await parse('#frontend-ui #frontend-api');
            expect(result.metadata.hierarchy).toEqual({
                frontend: {
                    ui: {},
                    api: {}
                }
            });
        });
    });

    describe('Tag Validation', () => {
        test('validates tag format', async () => {
            const result = await parse('#123invalid');
            expect(result).toBeNull();
        });

        test('enforces tag length limits', async () => {
            const longTag = 'a'.repeat(31);
            const result = await parse(`#${longTag}`);
            expect(result).toBeNull();
        });
    });

    describe('Confidence Scoring', () => {
        test('should have higher confidence for explicit tags', async () => {
            const result = await parse('[tag:important]');
            expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.9);
        });

        test('should have lower confidence for hashtag format', async () => {
            const result = await parse('#important');
            expect(result.metadata.confidence).toBeLessThanOrEqual(0.8);
        });
    });

    describe('Error Handling', () => {
        test('handles malformed tags', async () => {
            const result = await parse('#!invalid');
            expect(result).toBeNull();
        });

        test('handles parser errors gracefully', async () => {
            // Force regex error
            const result = await parse('#');
            expect(result).toBeNull();
        });
    });
});
