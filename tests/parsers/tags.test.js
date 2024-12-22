import tagsParser from '../../src/services/parser/parsers/tags.js';

describe('Tags Parser', () => {
    describe('Input Validation', () => {
        test('handles null input', () => {
            const result = tagsParser.parse(null);
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('handles empty string', () => {
            const result = tagsParser.parse('');
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('returns null for text without tags', () => {
            const result = tagsParser.parse('Regular text without tags');
            expect(result).toBeNull();
        });
    });

    describe('Tag Patterns', () => {
        test('parses hashtags', () => {
            const result = tagsParser.parse('Task with #feature and #bugfix');
            expect(result.value).toContain('feature');
            expect(result.value).toContain('bugfix');
            expect(result.metadata.pattern).toBe('multiple');
        });

        test('parses category tags', () => {
            const result = tagsParser.parse('Task with +frontend and +backend');
            expect(result.value).toContain('frontend');
            expect(result.value).toContain('backend');
        });

        test('parses topic tags', () => {
            const result = tagsParser.parse('Task with @ui and @api');
            expect(result.value).toContain('ui');
            expect(result.value).toContain('api');
        });

        test('parses inline category tags', () => {
            const result = tagsParser.parse('Task with [database] and [testing]');
            expect(result.value).toContain('database');
            expect(result.value).toContain('testing');
        });

        test('handles mixed tag types', () => {
            const result = tagsParser.parse('Task #feature +frontend @ui [testing]');
            expect(result.value).toHaveLength(4);
            expect(result.metadata.pattern).toBe('multiple');
        });
    });

    describe('Tag Validation', () => {
        test('validates tag length', () => {
            const result = tagsParser.parse('#a #toolongtagthatexceedsthirtychars');
            expect(result?.value || []).not.toContain('a');
            expect(result?.value || []).not.toContain('toolongtagthatexceedsthirtychars');
        });

        test('validates tag characters', () => {
            const result = tagsParser.parse('#valid #!invalid #123invalid');
            expect(result?.value || []).toContain('valid');
            expect(result?.value || []).not.toContain('invalid');
            expect(result?.value || []).not.toContain('123invalid');
        });

        test('validates hyphenated tags', () => {
            const result = tagsParser.parse('#valid-tag #invalid--tag');
            expect(result?.value || []).toContain('valid-tag');
            expect(result?.value || []).not.toContain('invalid--tag');
        });
    });

    describe('Tag Normalization', () => {
        test('normalizes known prefixes', () => {
            const result = tagsParser.parse('#feat-ui #doc-api #bug-fixed');
            expect(result.value).toContain('feature-ui');
            expect(result.value).toContain('documentation-api');
            expect(result.value).toContain('bugfix-fixed');
        });

        test('preserves unknown prefixes', () => {
            const result = tagsParser.parse('#custom-tag #another-tag');
            expect(result.value).toContain('custom-tag');
            expect(result.value).toContain('another-tag');
        });
    });

    describe('Tag Categorization', () => {
        test('categorizes by type', () => {
            const result = tagsParser.parse('#feature #bugfix #testing');
            expect(result.metadata.categorized.type).toContain('feature');
            expect(result.metadata.categorized.type).toContain('bugfix');
            expect(result.metadata.categorized.type).toContain('testing');
        });

        test('categorizes by status', () => {
            const result = tagsParser.parse('#todo #wip #blocked');
            expect(result.metadata.categorized.status).toEqual(
                expect.arrayContaining(['todo', 'in-progress', 'blocked'])
            );
        });

        test('categorizes by priority', () => {
            const result = tagsParser.parse('#critical #important #trivial');
            expect(result.metadata.categorized.priority).toEqual(
                expect.arrayContaining(['critical', 'important', 'trivial'])
            );
        });

        test('categorizes by component', () => {
            const result = tagsParser.parse('#frontend #backend #api');
            expect(result.metadata.categorized.component).toEqual(
                expect.arrayContaining(['frontend', 'backend', 'api'])
            );
        });

        test('groups uncategorized tags', () => {
            const result = tagsParser.parse('#feature #custom-tag #another-tag');
            expect(result.metadata.categorized.type).toContain('feature');
            expect(result.metadata.categorized.other).toEqual(
                expect.arrayContaining(['custom-tag', 'another-tag'])
            );
        });
    });

    describe('Tag Hierarchy', () => {
        test('builds simple hierarchies', () => {
            const result = tagsParser.parse('#ui-component #ui-layout');
            expect(result.metadata.hierarchy).toEqual({
                ui: {
                    component: {},
                    layout: {}
                }
            });
        });

        test('builds nested hierarchies', () => {
            const result = tagsParser.parse('#ui-component-button #ui-component-input');
            expect(result.metadata.hierarchy).toEqual({
                ui: {
                    component: {
                        button: {},
                        input: {}
                    }
                }
            });
        });

        test('handles multiple root tags', () => {
            const result = tagsParser.parse('#ui-component #api-endpoint #db-query');
            expect(result.metadata.hierarchy).toEqual({
                ui: {
                    component: {}
                },
                api: {
                    endpoint: {}
                },
                db: {
                    query: {}
                }
            });
        });

        test('merges overlapping hierarchies', () => {
            const result = tagsParser.parse('#ui-component #ui-layout #ui-component-button');
            expect(result.metadata.hierarchy).toEqual({
                ui: {
                    component: {
                        button: {}
                    },
                    layout: {}
                }
            });
        });
    });

    describe('Confidence Scoring', () => {
        test('assigns higher confidence to standard patterns', () => {
            const results = [
                tagsParser.parse('#feature'),        // hashtag
                tagsParser.parse('+feature'),        // category
                tagsParser.parse('@feature'),        // topic
                tagsParser.parse('[feature]')        // inline
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(confidences[0]).toBeGreaterThan(confidences[1]);
            expect(confidences[1]).toBeGreaterThan(confidences[2]);
            expect(confidences[2]).toBeGreaterThan(confidences[3]);
        });

        test('increases confidence for known categories', () => {
            const results = [
                tagsParser.parse('#feature'),        // known category
                tagsParser.parse('#custom-tag')      // unknown category
            ];

            expect(results[0].metadata.confidence)
                .toBeGreaterThan(results[1].metadata.confidence);
        });

        test('adjusts confidence based on tag quality', () => {
            const results = [
                tagsParser.parse('#a'),              // too short
                tagsParser.parse('#tag'),            // basic
                tagsParser.parse('#quality-tag')     // hyphenated
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(confidences[2]).toBeGreaterThan(confidences[1]);
            expect(confidences[1]).toBeGreaterThan(confidences[0]);
        });

        test('considers tag position', () => {
            const results = [
                tagsParser.parse('#tag at start'),
                tagsParser.parse('in middle #tag here'),
                tagsParser.parse('at end #tag')
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(confidences[2]).toBeGreaterThan(confidences[0]);
        });
    });

    describe('Error Handling', () => {
        test('handles regex errors gracefully', () => {
            // Force a regex error with invalid pattern
            const badPattern = { pattern: /(?<!x)/, confidence: 0.9 };
            const originalPatterns = { ...tagsParser.PATTERNS };
            tagsParser.PATTERNS = { bad: badPattern };

            const result = tagsParser.parse('test #tag');
            expect(result).toEqual({
                type: 'error',
                error: 'PARSER_ERROR',
                message: expect.any(String)
            });

            // Restore original patterns
            tagsParser.PATTERNS = originalPatterns;
        });

        test('handles validation errors gracefully', () => {
            // Mock validation to throw error
            const originalValidate = tagsParser.validateTag;
            tagsParser.validateTag = () => { throw new Error('Validation error'); };

            const result = tagsParser.parse('#tag');
            expect(result).toEqual({
                type: 'error',
                error: 'PARSER_ERROR',
                message: 'Validation error'
            });

            // Restore original validation
            tagsParser.validateTag = originalValidate;
        });
    });
});
