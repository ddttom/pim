import parser from '../src/services/parser.js';
import MockLogger from './__mocks__/logger.js';

describe('Plugin System', () => {
    beforeEach(() => {
        // Reset parser plugins before each test
        parser.resetPlugins();
        // Reset mock logger
        jest.clearAllMocks();
        // Mock console.error to avoid test output noise
        console.error = jest.fn();
    });

    describe('Plugin Registration', () => {
        test('should register valid plugin', () => {
            const testPlugin = {
                parse: () => ({ test: true })
            };

            expect(() => {
                parser.registerPlugin('test', testPlugin);
            }).not.toThrow();
        });

        test('should reject invalid plugin', () => {
            const invalidPlugin = {};
            
            expect(() => {
                parser.registerPlugin('invalid', invalidPlugin);
            }).toThrow('Invalid plugin: must have a parse method');
        });
    });

    describe('Plugin Parsing', () => {
        test('should include plugin results in parse output', () => {
            const locationPlugin = {
                parse: () => ({
                    building: 'A',
                    room: '123',
                }),
            };

            parser.registerPlugin('location', locationPlugin);
            const result = parser.parse('meeting in Building A Room 123');
            
            expect(result.parsed.plugins.location).toEqual({
                building: 'A',
                room: '123',
            });
        });

        test('should handle multiple plugins', () => {
            const customPlugin = {
                parse: () => ({ custom: true }),
            };
            const locationPlugin = {
                parse: () => ({ location: 'test' }),
            };

            parser.registerPlugin('custom', customPlugin);
            parser.registerPlugin('location', locationPlugin);
            const result = parser.parse('meeting custom-test in Room 123');
            
            expect(result.parsed.plugins).toMatchObject({
                custom: { custom: true },
                location: { location: 'test' },
            });
        });

        test('should handle plugin errors gracefully', () => {
            const errorPlugin = {
                parse: () => {
                    throw new Error('Plugin error');
                },
            };

            parser.registerPlugin('error', errorPlugin);
            const result = parser.parse('test text');
            
            // Verify plugins object is empty when error occurs
            expect(result.parsed.plugins).toEqual({});
            // Verify error was logged
            expect(console.error).toHaveBeenCalledWith('Plugin error failed:', expect.any(Error));
        });
    });
});
