import MockLogger from '../__mocks__/logger';
import linksParser from '../../src/services/parser/parsers/links.js';

jest.mock('../../src/utils/logger.js', () => {
  return {
    createLogger: () => new MockLogger()
  };
});

describe('Links Parser', () => {
  const testCases = [
    {
      input: 'Check out https://example.com',
      expected: ['https://example.com']
    },
    {
      input: 'Multiple links: https://example.com and http://test.com',
      expected: ['https://example.com', 'http://test.com']
    },
    {
      input: 'No links here',
      expected: []
    },
    {
      input: '',
      expected: []
    }
  ];

  testCases.forEach(({ input, expected }, index) => {
    test(`Test case ${index + 1}: should correctly parse links`, () => {
      const result = linksParser.parse(input);
      expect(result).toEqual(expected);
    });
  });
});
