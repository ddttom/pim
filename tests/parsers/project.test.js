import { name, parse } from '../../src/services/parser/parsers/project.js';

describe('Project Parser', () => {
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

        test('returns null for text without project', async () => {
            const result = await parse('Regular text without project');
            expect(result).toBeNull();
        });
    });

    describe('Project References', () => {
        test('parses explicit project declarations', async () => {
            const result = await parse('project: Alpha');
            expect(result).toEqual({
                type: 'project',
                value: {
                    project: 'Alpha',
                    originalName: 'Alpha'
                },
                metadata: {
                    pattern: 'explicit',
                    confidence: expect.any(Number),
                    originalMatch: 'project: Alpha',
                    indicators: expect.any(Array)
                }
            });
        });

        test('parses project references', async () => {
            const result = await parse('re: Project Beta');
            expect(result.value.project).toBe('Beta');
            expect(result.metadata.pattern).toBe('reference');
        });

        test('parses project identifiers', async () => {
            const result = await parse('PRJ-123');
            expect(result.value.project).toBe('123');
            expect(result.metadata.pattern).toBe('identifier');
        });

        test('parses shorthand notation', async () => {
            const result = await parse('$Frontend');
            expect(result.value.project).toBe('Frontend');
            expect(result.metadata.pattern).toBe('shorthand');
        });

        test('parses contextual references', async () => {
            const result = await parse('Task for project Backend');
            expect(result.value.project).toBe('Backend');
            expect(result.metadata.pattern).toBe('contextual');
        });
    });

    describe('Project Name Validation', () => {
        test('validates minimum length', async () => {
            const result = await parse('project: A');
            expect(result).toBeNull();
        });

        test('validates maximum length', async () => {
            const longName = 'A'.repeat(51);
            const result = await parse(`project: ${longName}`);
            expect(result).toBeNull();
        });

        test('validates allowed characters', async () => {
            const validNames = ['Project123', 'Frontend_API', 'Backend-Service'];
            const invalidNames = ['Project!', 'Front@end', 'Back#end'];

            for (const name of validNames) {
                const result = await parse(`project: ${name}`);
                expect(result).not.toBeNull();
            }

            for (const name of invalidNames) {
                const result = await parse(`project: ${name}`);
                expect(result).toBeNull();
            }
        });

        test('rejects ignored terms', async () => {
            const ignoredTerms = ['the', 'this', 'new', 'project'];
            for (const term of ignoredTerms) {
                const result = await parse(`project: ${term}`);
                expect(result).toBeNull();
            }
        });
    });

    describe('Project Indicators', () => {
        test('detects project terms', async () => {
            const result = await parse('milestone for project Alpha');
            expect(result.metadata.indicators).toContain('project_term');
        });

        test('detects task organization', async () => {
            const result = await parse('story under project Beta');
            expect(result.metadata.indicators).toContain('task_organization');
        });

        test('detects stakeholders', async () => {
            const result = await parse('client project Gamma');
            expect(result.metadata.indicators).toContain('stakeholder');
        });

        test('detects timeline references', async () => {
            const result = await parse('roadmap for project Delta');
            expect(result.metadata.indicators).toContain('timeline');
        });
    });

    describe('Confidence Scoring', () => {
        test('assigns higher confidence to explicit declarations', async () => {
            const results = [
                await parse('project: Alpha'),
                await parse('PRJ-123'),
                await parse('$Beta'),
                await parse('for project Gamma')
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(confidences[0]).toBeGreaterThan(confidences[2]);
            expect(confidences[1]).toBeGreaterThan(confidences[3]);
        });

        test('adjusts confidence based on indicators', async () => {
            const withIndicators = await parse('milestone for project Alpha with client');
            const withoutIndicators = await parse('project Alpha');
            expect(withIndicators.metadata.confidence)
                .toBeGreaterThan(withoutIndicators.metadata.confidence);
        });

        test('considers project name format', async () => {
            const results = [
                await parse('project: simple'),
                await parse('project: CamelCase'),
                await parse('project: With_Separator')
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(confidences[2]).toBeGreaterThan(confidences[1]);
            expect(confidences[1]).toBeGreaterThan(confidences[0]);
        });
    });

    describe('Error Handling', () => {
        test('handles validation errors gracefully', async () => {
            const result = await parse('project: Invalid!@#');
            expect(result).toBeNull();
        });

        test('handles parser errors', async () => {
            // Mock validateProjectName to throw
            const originalValidate = parse.validateProjectName;
            parse.validateProjectName = () => {
                throw new Error('Validation error');
            };

            const result = await parse('project: Test');
            expect(result).toEqual({
                type: 'error',
                error: 'PARSER_ERROR',
                message: 'Validation error'
            });

            // Restore original function
            parse.validateProjectName = originalValidate;
        });
    });
}); 
