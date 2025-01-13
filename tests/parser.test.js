import { jest } from '@jest/globals';
import Parser from '../src/services/parser.js';

describe('Parser Tests', () => {
  let parser;

  beforeEach(() => {
    parser = new Parser();
  });

  test('parses status correctly', () => {
    const entry = parser.parse('[In Progress] Test entry');
    expect(entry.status).toBe('In Progress');
  });

  test('parses priority correctly', () => {
    const entry = parser.parse('(High) Test entry');
    expect(entry.priority).toBe('High');
  });

  test('parses participants correctly', () => {
    const entry = parser.parse('Test entry @user1 @user2');
    expect(entry.participants).toEqual(['user1', 'user2']);
  });

  test('parses tags correctly', () => {
    const entry = parser.parse('Test entry #tag1 #tag2');
    expect(entry.tags).toEqual(['tag1', 'tag2']);
  });

  test('parses due date correctly', () => {
    const entry = parser.parse('Test entry due 2025-01-15');
    expect(entry.dueDate).toBe('2025-01-15');
  });

  test('handles null input', () => {
    const entry = parser.parse(null);
    expect(entry).toEqual({
      text: '',
      status: 'None',
      priority: null,
      participants: [],
      tags: [],
      dueDate: null
    });
  });

  test('handles empty string', () => {
    const entry = parser.parse('');
    expect(entry).toEqual({
      text: '',
      status: 'None',
      priority: null,
      participants: [],
      tags: [],
      dueDate: null
    });
  });
});
