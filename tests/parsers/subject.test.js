import { name, parse } from '../../src/services/parser/parsers/subject.js';

describe('Subject Parser', () => {
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
    });

    describe('Text Cleanup', () => {
        test('removes time references', async () => {
            const result = await parse('Review docs at 2:30pm');
            expect(result.value.text).toBe('Review docs');
            expect(result.metadata.removedParts).toContain('at 2:30pm');
        });

        test('removes date references', async () => {
            const result = await parse('Submit report by Monday');
            expect(result.value.text).toBe('Submit report');
            expect(result.metadata.removedParts).toContain('by Monday');
        });

        test('removes project references', async () => {
            const result = await parse('Update UI for project Alpha');
            expect(result.value.text).toBe('Update UI');
            expect(result.metadata.removedParts).toContain('for project Alpha');
        });

        test('removes priority markers', async () => {
            const result = await parse('High priority Fix bug');
            expect(result.value.text).toBe('Fix bug');
            expect(result.metadata.removedParts).toContain('High priority');
        });

        test('removes tags and mentions', async () => {
            const result = await parse('Review PR #frontend @john');
            expect(result.value.text).toBe('Review PR');
            expect(result.metadata.removedParts).toContain('#frontend');
            expect(result.metadata.removedParts).toContain('@john');
        });
    });

    describe('Subject Validation', () => {
        test('validates minimum length', async () => {
            const result = await parse('a');
            expect(result).toBeNull();
        });

        test('validates start words', async () => {
            const invalidStarts = ['the', 'a', 'an', 'to', 'in'];
            for (const start of invalidStarts) {
                const result = await parse(`${start} task`);
                expect(result).toBeNull();
            }
        });
    });

    describe('Key Terms', () => {
        test('extracts action verbs', async () => {
            const result = await parse('Create new documentation');
            expect(result.value.keyTerms).toContain('create');
            expect(result.metadata.hasActionVerb).toBe(true);
        });

        test('identifies significant terms', async () => {
            const result = await parse('Implement login feature');
            expect(result.value.keyTerms).toContain('implement');
            expect(result.value.keyTerms).toContain('login');
            expect(result.value.keyTerms).toContain('feature');
        });
    });

    describe('Confidence Scoring', () => {
        test('considers text length', async () => {
            const results = [
                await parse('Fix bug'),
                await parse('Implement new login feature'),
                await parse('Create comprehensive documentation for API integration')
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(confidences[2]).toBeGreaterThan(confidences[1]);
            expect(confidences[1]).toBeGreaterThan(confidences[0]);
        });

        test('considers action verbs', async () => {
            const withVerb = await parse('Create documentation');
            const withoutVerb = await parse('Project documentation');
            expect(withVerb.metadata.confidence)
                .toBeGreaterThan(withoutVerb.metadata.confidence);
        });
    });

    describe('Error Handling', () => {
        test('handles cleanup errors gracefully', async () => {
            const result = await parse('Invalid \0 character');
            expect(result).toEqual({
                type: 'error',
                error: 'PARSER_ERROR',
                message: expect.any(String)
            });
        });
    });
});
