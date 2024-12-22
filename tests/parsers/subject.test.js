import subjectParser from '../../src/services/parser/parsers/subject.js';

describe('Subject Parser', () => {
    describe('Input Validation', () => {
        test('handles null input', () => {
            const result = subjectParser.parse(null);
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('handles empty string', () => {
            const result = subjectParser.parse('');
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('validates minimum length', () => {
            const result = subjectParser.parse('ab');
            expect(result).toBeNull();
        });
    });

    describe('Pattern Removal', () => {
        test('removes time patterns', () => {
            const result = subjectParser.parse('Review documentation at 2:30pm');
            expect(result.value.text).toBe('Review documentation');
            expect(result.metadata.removedParts).toContain('at 2:30pm');
        });

        test('removes date patterns', () => {
            const result = subjectParser.parse('Submit report by next monday');
            expect(result.value.text).toBe('Submit report');
            expect(result.metadata.removedParts).toContain('by next monday');
        });

        test('removes project references', () => {
            const result = subjectParser.parse('Update UI for project Alpha');
            expect(result.value.text).toBe('Update UI');
            expect(result.metadata.removedParts).toContain('for project Alpha');
        });

        test('removes priority markers', () => {
            const result = subjectParser.parse('High priority Fix bug in login');
            expect(result.value.text).toBe('Fix bug in login');
            expect(result.metadata.removedParts).toContain('High priority');
        });

        test('removes tags and mentions', () => {
            const result = subjectParser.parse('Review PR #frontend with @john');
            expect(result.value.text).toBe('Review PR');
            expect(result.metadata.removedParts).toContain('#frontend');
            expect(result.metadata.removedParts).toContain('@john');
        });
    });

    describe('Subject Validation', () => {
        test('rejects invalid start words', () => {
            const invalidStarts = [
                'the review documentation',
                'a new feature',
                'an important task',
                'to create report',
                'in the morning'
            ];

            invalidStarts.forEach(text => {
                const result = subjectParser.parse(text);
                expect(result).toBeNull();
            });
        });

        test('handles valid start words', () => {
            const validStarts = [
                'Create new report',
                'Review documentation',
                'Update user interface',
                'Fix login bug'
            ];

            validStarts.forEach(text => {
                const result = subjectParser.parse(text);
                expect(result).not.toBeNull();
                expect(result.value.text).toBe(text);
            });
        });

        test('rejects common words only', () => {
            const result = subjectParser.parse('the in on at by');
            expect(result).toBeNull();
        });
    });

    describe('Key Terms Extraction', () => {
        test('extracts action verbs', () => {
            const result = subjectParser.parse('Create new documentation for API');
            expect(result.value.keyTerms).toContain('create');
        });

        test('extracts potential nouns', () => {
            const result = subjectParser.parse('Update UserInterface Component');
            expect(result.value.keyTerms).toContain('userinterface');
            expect(result.value.keyTerms).toContain('component');
        });

        test('handles multiple key terms', () => {
            const result = subjectParser.parse('Review API Documentation');
            expect(result.value.keyTerms).toContain('review');
            expect(result.value.keyTerms).toContain('api');
            expect(result.value.keyTerms).toContain('documentation');
        });
    });

    describe('Confidence Scoring', () => {
        test('adjusts confidence based on text length', () => {
            const results = [
                subjectParser.parse('Fix bug'),
                subjectParser.parse('Implement new login feature'),
                subjectParser.parse('Create comprehensive documentation for API integration')
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(confidences[1]).toBeGreaterThan(confidences[0]);
            expect(confidences[2]).toBeGreaterThan(confidences[1]);
        });

        test('considers removed parts', () => {
            const withoutExtra = subjectParser.parse('Fix login bug');
            const withExtra = subjectParser.parse('Fix login bug #frontend @john high priority');
            expect(withExtra.metadata.confidence).toBeGreaterThan(withoutExtra.metadata.confidence);
        });

        test('adjusts based on position', () => {
            const atStart = subjectParser.parse('Fix bug in login');
            const withPrefix = subjectParser.parse('High priority: Fix bug in login');
            expect(atStart.metadata.confidence).toBeGreaterThan(withPrefix.metadata.confidence);
        });
    });

    describe('Error Handling', () => {
        test('handles regex errors gracefully', () => {
            // Force a regex error by modifying cleanup patterns
            const originalPatterns = [...subjectParser.CLEANUP_PATTERNS];
            subjectParser.CLEANUP_PATTERNS = [/(?<!x)/]; // Invalid pattern

            const result = subjectParser.parse('Test subject');
            expect(result).toEqual({
                type: 'error',
                error: 'PARSER_ERROR',
                message: expect.any(String)
            });

            // Restore original patterns
            subjectParser.CLEANUP_PATTERNS = originalPatterns;
        });

        test('handles validation errors gracefully', () => {
            // Mock validateSubject to throw
            const originalValidate = subjectParser.validateSubject;
            subjectParser.validateSubject = () => {
                throw new Error('Validation error');
            };

            const result = subjectParser.parse('Test subject');
            expect(result).toEqual({
                type: 'error',
                error: 'PARSER_ERROR',
                message: 'Validation error'
            });

            // Restore original function
            subjectParser.validateSubject = originalValidate;
        });
    });
});
