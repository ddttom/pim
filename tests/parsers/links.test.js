import { jest } from '@jest/globals';
import linksParser from '../../src/services/parser/parsers/links.js';

// Mock logger
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('Links Parser Tests', () => {
  test('parses web links', () => {
    const text = 'Visit https://example.com and http://test.com';
    const result = linksParser.parse(text);
    
    expect(result.links).toEqual([
      { type: 'web', url: 'https://example.com' },
      { type: 'web', url: 'http://test.com' }
    ]);
  });

  test('parses file links', () => {
    const text = 'Open file:///path/to/file.txt';
    const result = linksParser.parse(text);
    
    expect(result.links).toEqual([
      { type: 'file', url: 'file:///path/to/file.txt' }
    ]);
  });

  test('handles mixed content', () => {
    const text = 'Links: https://example.com and file:///path/to/file.txt';
    const result = linksParser.parse(text);
    
    expect(result.links).toEqual([
      { type: 'web', url: 'https://example.com' },
      { type: 'file', url: 'file:///path/to/file.txt' }
    ]);
  });

  test('returns empty array for no links', () => {
    const text = 'No links here';
    const result = linksParser.parse(text);
    
    expect(result.links).toEqual([]);
  });

  test('preserves original text', () => {
    const text = 'Visit https://example.com';
    const result = linksParser.parse(text);
    
    expect(result.text).toBe(text);
  });
});
