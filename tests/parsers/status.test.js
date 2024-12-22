import statusParser from '../../src/services/parser/parsers/status.js';

describe('Status Parser', () => {
    describe('Input Validation', () => {
        test('handles null input', () => {
            const result = statusParser.parse(null);
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('handles empty string', () => {
            const result = statusParser.parse('');
            expect(result).toEqual({
                type: 'error',
                error: 'INVALID_INPUT',
                message: 'Input must be a non-empty string'
            });
        });

        test('returns null for text without status', () => {
            const result = statusParser.parse('Regular text without status');
            expect(result).toBeNull();
        });
    });

    describe('Explicit Status', () => {
        test('parses explicit status declarations', () => {
            const result = statusParser.parse('Task status: in progress');
            expect(result).toEqual({
                type: 'status',
                value: 'started',
                metadata: {
                    pattern: 'explicit',
                    confidence: expect.any(Number),
                    category: 'active',
                    progress: null,
                    allowedTransitions: ['completed', 'blocked', 'cancelled'],
                    explicit: true,
                    originalMatch: 'status: in progress'
                }
            });
        });

        test('normalizes explicit status variants', () => {
            const cases = [
                ['status: in-progress', 'started'],
                ['status: on hold', 'blocked'],
                ['status: done', 'completed']
            ];

            cases.forEach(([input, expected]) => {
                const result = statusParser.parse(input);
                expect(result.value).toBe(expected);
                expect(result.metadata.explicit).toBe(true);
            });
        });
    });

    describe('Progress-based Status', () => {
        test('infers completion from 100%', () => {
            const result = statusParser.parse('Task 100% complete');
            expect(result.value).toBe('completed');
            expect(result.metadata.progress).toBe(100);
        });

        test('captures progress without status change', () => {
            const result = statusParser.parse('Task 50% complete');
            expect(result.metadata.progress).toBe(50);
            expect(result.value).not.toBe('completed');
        });
    });

    describe('Status Keywords', () => {
        test('recognizes started status', () => {
            const variants = [
                'Started working on task',
                'Task in progress',
                'Begun implementation',
                'Working on the feature'
            ];

            variants.forEach(input => {
                const result = statusParser.parse(input);
                expect(result.value).toBe('started');
                expect(result.metadata.category).toBe('active');
            });
        });

        test('recognizes completed status', () => {
            const variants = [
                'Task completed',
                'Feature is done',
                'Finished implementation',
                'Issue resolved'
            ];

            variants.forEach(input => {
                const result = statusParser.parse(input);
                expect(result.value).toBe('completed');
                expect(result.metadata.category).toBe('terminal');
            });
        });

        test('recognizes blocked status', () => {
            const variants = [
                'Task is blocked',
                'Work is stuck',
                'Waiting for review',
                'On hold pending approval'
            ];

            variants.forEach(input => {
                const result = statusParser.parse(input);
                expect(result.value).toBe('blocked');
                expect(result.metadata.category).toBe('inactive');
            });
        });
    });

    describe('Status Context', () => {
        test('considers progress indicators', () => {
            const result = statusParser.parse('Task in progress (75% complete)');
            expect(result.value).toBe('started');
            expect(result.metadata.progress).toBe(75);
            expect(result.metadata.confidence).toBeGreaterThan(0.85);
        });

        test('considers temporal indicators', () => {
            const withTime = statusParser.parse('Just started working on task');
            const withoutTime = statusParser.parse('Started working on task');
            expect(withTime.metadata.confidence)
                .toBeGreaterThan(withoutTime.metadata.confidence);
        });

        test('considers action verbs', () => {
            const withAction = statusParser.parse('Marked task as completed');
            const withoutAction = statusParser.parse('Task completed');
            expect(withAction.metadata.confidence)
                .toBeGreaterThan(withoutAction.metadata.confidence);
        });
    });

    describe('Status Transitions', () => {
        test('validates allowed transitions', () => {
            expect(statusParser.isTransitionAllowed('pending', 'started')).toBe(true);
            expect(statusParser.isTransitionAllowed('started', 'cancelled')).toBe(true);
            expect(statusParser.isTransitionAllowed('completed', 'cancelled')).toBe(false);
        });

        test('provides available transitions', () => {
            const pendingTransitions = statusParser.getAvailableTransitions('pending');
            expect(pendingTransitions).toContain('started');
            expect(pendingTransitions).toContain('cancelled');

            const startedTransitions = statusParser.getAvailableTransitions('started');
            expect(startedTransitions).toContain('completed');
            expect(startedTransitions).toContain('blocked');
        });
    });

    describe('Status Categories', () => {
        test('categorizes active statuses', () => {
            const result = statusParser.parse('Working on task');
            expect(result.metadata.category).toBe('active');
            expect(result.value).toBe('started');
        });

        test('categorizes inactive statuses', () => {
            const result = statusParser.parse('Task is blocked');
            expect(result.metadata.category).toBe('inactive');
            expect(result.value).toBe('blocked');
        });

        test('categorizes terminal statuses', () => {
            const result = statusParser.parse('Task cancelled');
            expect(result.metadata.category).toBe('terminal');
            expect(result.value).toBe('cancelled');
        });
    });

    describe('Confidence Scoring', () => {
        test('assigns higher confidence to explicit status', () => {
            const explicit = statusParser.parse('status: completed');
            const implicit = statusParser.parse('task completed');
            expect(explicit.metadata.confidence)
                .toBeGreaterThan(implicit.metadata.confidence);
        });

        test('adjusts confidence based on context', () => {
            const results = [
                statusParser.parse('Task completed'),
                statusParser.parse('Task completed today'),
                statusParser.parse('Task marked as completed with 100% progress')
            ];

            const confidences = results.map(r => r.metadata.confidence);
            expect(confidences[1]).toBeGreaterThan(confidences[0]);
            expect(confidences[2]).toBeGreaterThan(confidences[1]);
        });
    });

    describe('Error Handling', () => {
        test('handles invalid status values', () => {
            const result = statusParser.parse('status: invalid_status');
            expect(result).toBeNull();
        });

        test('handles malformed progress', () => {
            const result = statusParser.parse('Task 200% complete');
            expect(result).toBeNull();
        });

        test('handles parser errors gracefully', () => {
            // Mock normalizeStatus to throw
            const originalNormalize = statusParser.normalizeStatus;
            statusParser.normalizeStatus = () => {
                throw new Error('Normalization error');
            };

            const result = statusParser.parse('status: in_progress');
            expect(result).toEqual({
                type: 'error',
                error: 'PARSER_ERROR',
                message: 'Normalization error'
            });

            // Restore original function
            statusParser.normalizeStatus = originalNormalize;
        });
    });
});
