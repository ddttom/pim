import { jest } from '@jest/globals';
import Parser from '../src/services/parser.js';
import Database from '../src/services/database.js';

describe('Parser and Persistence Integration Tests', () => {
  let parser;
  let database;

  beforeEach(async () => {
    parser = new Parser();
    parser.resetPlugins = jest.fn();

    database = new Database();
    await database.init(); // Ensure database is initialized
    await database.clear(); // Clear any existing entries
  });

  test('parses and stores complex message correctly', async () => {
    const message = '[In Progress] (High) Test entry @user1 #tag1 due 2025-01-15';
    const parsed = parser.parse(message);
    
    await database.save(parsed);
    const entries = await database.getAll();
    
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      text: message,
      status: 'In Progress',
      priority: 'High',
      participants: ['user1'],
      tags: ['tag1'],
      dueDate: '2025-01-15'
    });
  });

  test('allows filtering by parsed properties', async () => {
    const messages = [
      '[In Progress] (High) Test 1 @user1 #tag1 due 2025-01-15',
      '[Done] (Low) Test 2 @user2 #tag2',
      '[In Progress] (Medium) Test 3 @user1 #tag3'
    ];

    for (const message of messages) {
      await database.save(parser.parse(message));
    }

    const entries = await database.getAll();
    const inProgress = entries.filter(e => e.status === 'In Progress');
    
    expect(inProgress).toHaveLength(2);
    expect(inProgress[0].text).toBe(messages[0]);
    expect(inProgress[1].text).toBe(messages[2]);
  });

  test('handles date-based queries', async () => {
    const messages = [
      '[In Progress] (High) Test 1 @user1 #tag1 due 2025-01-15',
      '[Done] (Low) Test 2 @user2 #tag2 due 2025-01-10',
      '[In Progress] (Medium) Test 3 @user1 #tag3 due 2025-01-20'
    ];

    for (const message of messages) {
      await database.save(parser.parse(message));
    }

    const entries = await database.getAll();
    const afterDate = entries.filter(e => e.dueDate && e.dueDate > '2025-01-14');
    
    expect(afterDate).toHaveLength(2);
    expect(afterDate[0].text).toBe(messages[0]);
    expect(afterDate[1].text).toBe(messages[2]);
  });

  test('updates parsed entry without duplication', async () => {
    const message = '[In Progress] (High) Test entry @user1 #tag1 due 2025-01-15';
    const parsed = parser.parse(message);
    
    // First save
    await database.save(parsed);
    
    // Update status and save again
    parsed.status = 'Done';
    await database.save(parsed);
    
    const entries = await database.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe('Done');
  });
});
