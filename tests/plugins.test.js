const Parser = require('../src/services/parser');
const MockLogger = require('./__mocks__/logger');

describe('Plugin System', () => {
    let parser;
    let logger;
    
    beforeEach(() => {
        logger = new MockLogger();
        parser = new Parser(logger);
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
            
            expect(result.plugins.location).toEqual({
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
            
            expect(result.plugins).toMatchObject({
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
            
            expect(result.plugins).toEqual({});
            // Verify error was logged
            expect(logger.error).toHaveBeenCalledWith(
                'Plugin error failed:',
                expect.any(Error)
            );
        });
    });
}); 