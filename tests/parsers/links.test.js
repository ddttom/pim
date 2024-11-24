const MockLogger = require('../__mocks__/logger');
const linksParser = require('../../src/services/parser/parsers/links');

jest.mock('../../src/utils/logger', () => {
  const logger = new MockLogger();
  return logger;
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