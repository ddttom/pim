import projectParser from '../../src/services/parser/parsers/project.js';

describe('Project Parser', () => {
    describe('Input Validation', () => {
        test('handles null input', () => {
            const result = projectParser.parse(null);
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('handles empty string', () => {
            const result = projectParser.parse('');
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('handles non-string input', () => {
            const result = projectParser.parse(123);
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });
    });

    describe('Explicit Project References', () => {
        test('parses explicit project declarations', () => {
            const result = projectParser.parse('Working on Project Alpha');
            expect(result).toEqual({
                type: 'project',
                value: {
                    project: 'Alpha',
                    originalName: 'Alpha'
                },
                metadata: {
                    pattern: 'explicit',
                    confidence: expect.any(Number),
                    originalMatch: 'Project Alpha',
                    indicators: expect.any(Array)
                }
            });
        });

        test('handles project names with hyphens and underscores', () => {
            const cases = [
                'Project alpha-beta',
                'Project user_auth',
                'Project mobile-v2.0'
            ];

            cases.forEach(input => {
                const result = projectParser.parse(input);
                expect(result.type).toBe('project');
                expect(result.metadata.pattern).toBe('explicit');
            });
        });
    });

    describe('Project References', () => {
        test('parses re: references', () => {
            const result = projectParser.parse('re: Project Migration');
            expect(result.value.project).toBe('Migration');
            expect(result.metadata.pattern).toBe('reference');
        });

        test('parses about references', () => {
            const result = projectParser.parse('about: Project Redesign');
            expect(result.value.project).toBe('Redesign');
            expect(result.metadata.pattern).toBe('reference');
        });
    });

    describe('Project Identifiers', () => {
        test('parses project IDs', () => {
            const cases = [
                ['PRJ-123', '123'],
                ['PROJ-456', '456']
            ];

            cases.forEach(([input, expected]) => {
                const result = projectParser.parse(input);
                expect(result.value.project).toBe(expected);
                expect(result.metadata.pattern).toBe('identifier');
                expect(result.metadata.confidence).toBeGreaterThanOrEqual(0.95);
            });
        });
    });

    describe('Shorthand Notation', () => {
        test('parses $ shorthand', () => {
            const result = projectParser.parse('Update for $WebApp');
            expect(result.value.project).toBe('WebApp');
            expect(result.metadata.pattern).toBe('shorthand');
        });
    });

    describe('Contextual References', () => {
        test('parses for/under references', () => {
            const cases = [
                'Task for project Mobile',
                'Working under project Backend'
            ];

            cases.forEach(input => {
                const result = projectParser.parse(input);
                expect(result.type).toBe('project');
                expect(result.metadata.pattern).toBe('contextual');
            });
        });
    });

    describe('Project Name Validation', () => {
        test('rejects single character names', () => {
            const result = projectParser.parse('Project A');
            expect(result).toBeNull();
        });

        test('rejects ignored terms', () => {
            const cases = [
                'Project the',
                'Project this',
                'Project new'
            ];

            cases.forEach(input => {
                const result = projectParser.parse(input);
                expect(result).toBeNull();
            });
        });

        test('validates character constraints', () => {
            const cases = [
                'Project Valid-Name',     // valid
                'Project @invalid',       // invalid
                'Project valid_name',     // valid
                'Project invalid!name'    // invalid
            ];

            const results = cases.map(input => projectParser.parse(input));
            expect(results[0]).not.toBeNull();
            expect(results[1]).toBeNull();
            expect(results[2]).not.toBeNull();
            expect(results[3]).toBeNull();
        });
    });

    describe('Project Indicators', () => {
        test('identifies project-related terms', () => {
            const result = projectParser.parse('Project Alpha milestone review');
            expect(result.metadata.indicators).toContain('project_term');
        });

        test('recognizes task organization terms', () => {
            const result = projectParser.parse('Project Beta epic planning');
            expect(result.metadata.indicators).toContain('task_organization');
        });

        test('detects stakeholder references', () => {
            const result = projectParser.parse('Project Gamma client meeting');
            expect(result.metadata.indicators).toContain('stakeholder');
        });

        test('identifies timeline indicators', () => {
            const result = projectParser.parse('Project Delta roadmap update');
            expect(result.metadata.indicators).toContain('timeline');
        });
    });

    describe('Confidence Scoring', () => {
        test('assigns higher confidence to capitalized names', () => {
            const lowercaseResult = projectParser.parse('Project testproject');
            const capitalizedResult = projectParser.parse('Project TestProject');
            expect(capitalizedResult.metadata.confidence)
                .toBeGreaterThan(lowercaseResult.metadata.confidence);
        });

        test('adjusts confidence based on indicators', () => {
            const basicResult = projectParser.parse('Project Alpha');
            const withIndicatorsResult = projectParser.parse('Project Alpha milestone review with stakeholders');
            expect(withIndicatorsResult.metadata.confidence)
                .toBeGreaterThan(basicResult.metadata.confidence);
        });

        test('considers name formatting', () => {
            const results = [
                projectParser.parse('Project simple'),
                projectParser.parse('Project well-named'),
                projectParser.parse('Project proper_name')
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(confidences[1]).toBeGreaterThan(confidences[0]);
            expect(confidences[2]).toBeGreaterThan(confidences[0]);
        });
    });

    describe('Name Formatting', () => {
        test('handles multiple spaces', () => {
            const result = projectParser.parse('Project   Multiple   Spaces');
            expect(result.value.project).toBe('Multiple Spaces');
        });

        test('trims hyphens and underscores', () => {
            const cases = [
                ['Project --Alpha--', 'Alpha'],
                ['Project __Beta__', 'Beta'],
                ['Project -_Gamma_-', 'Gamma']
            ];

            cases.forEach(([input, expected]) => {
                const result = projectParser.parse(input);
                expect(result.value.project).toBe(expected);
            });
        });

        test('capitalizes words consistently', () => {
            const cases = [
                ['Project test project', 'Test Project'],
                ['Project API integration', 'API Integration'],
                ['Project web-app', 'Web-App']
            ];

            cases.forEach(([input, expected]) => {
                const result = projectParser.parse(input);
                expect(result.value.project).toBe(expected);
            });
        });
    });

    describe('Error Cases', () => {
        test('handles excessive length', () => {
            const longName = 'A'.repeat(51);
            const result = projectParser.parse(`Project ${longName}`);
            expect(result).toBeNull();
        });

        test('handles invalid characters', () => {
            const result = projectParser.parse('Project Name!@#');
            expect(result).toBeNull();
        });

        test('handles parser errors gracefully', () => {
            // Mock a parsing error
            jest.spyOn(projectParser, 'validateProjectName').mockImplementationOnce(() => {
                throw new Error('Validation error');
            });

            const result = projectParser.parse('Project Test');
            expect(result).toEqual({
                type: 'error',
                error: 'PARSER_ERROR',
                message: 'Validation error'
            });
        });
    });
});
