const linksParser = require('../../src/services/parser/parsers/links');

describe('Links Parser', () => {
  const testCases = [
    {
      input: 'Check out this link https://example.com and this one http://test.com/path?param=1',
      expected: ['https://example.com', 'http://test.com/path?param=1'],
    },
    {
      input: 'No links here',
      expected: [],
    },
    {
      input: 'Multiple https://example.com/1 links https://example.com/2 in https://example.com/3 text',
      expected: ['https://example.com/1', 'https://example.com/2', 'https://example.com/3'],
    },
    {
      input: null,
      expected: [],
    },
  ];

  testCases.forEach(({ input, expected }, index) => {
    test(`Test case ${index + 1}: should correctly parse links`, () => {
      const result = linksParser.parse(input);
      expect(result).toEqual(expected);
    });
  });
}); 