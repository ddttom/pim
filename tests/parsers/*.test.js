import { name, parse } from '../../src/services/parser/parsers/parser-name.js';

describe('Parser Name', () => {
    test('handles null input', async () => {
        const result = await parse(null);
        expect(result).toEqual({
            type: 'error',
            error: 'INVALID_INPUT',
            message: 'Input must be a non-empty string'
        });
    });
}); 
