const path = require('path');
const fs = require('fs').promises;
const Parser = require('../src/services/parser');
const JsonDatabaseService = require('../src/services/json-database');
const logger = require('../src/services/logger');

describe('Parser and Persistence Integration Tests', () => {
  const TEST_DIR = path.join(__dirname, '__test_data__');
  let parser;
  let dbService;
  let testDbPath;

  beforeAll(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
    parser = new Parser(logger);
  });

  beforeEach(async () => {
    const testId = Date.now();
    testDbPath = path.join(TEST_DIR, `pim.test.${testId}.json`);
    dbService = new JsonDatabaseService();
    await dbService.initialize(testDbPath);
  });

  afterEach(async () => {
    if (dbService?.isInitialized()) {
      await dbService.close();
    }
    if (await fs.access(testDbPath).then(() => true).catch(() => false)) {
      await fs.unlink(testDbPath);
    }
  });

  afterAll(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  describe('Complex Message Parsing and Storage', () => {
    const testMessage = "Call Fiona next wednesday re Project Cheesecake urgently with @robin and @ian #disaster";

    test('parses and stores complex message correctly', async () => {
      // 1. Parse the message
      const parsed = parser.parse(testMessage);

      // 2. Verify parsing results
      expect(parsed).toMatchObject({
        parsed: {
          action: 'call',
          contact: 'Fiona',
          project: {
            project: 'Cheesecake'
          },
          final_deadline: expect.any(String), // Will be next Wednesday's date
          status: 'pending',
          priority: 'high', // Due to "urgently"
          participants: ['robin', 'ian'],
          tags: ['disaster']
        },
        raw_content: testMessage
      });

      // 3. Store in database
      const id = await dbService.addEntry(parsed);

      // 4. Retrieve and verify storage
      const retrieved = await dbService.getEntry(id);
      expect(retrieved).toMatchObject({
        content: testMessage,
        parsed: {
          action: 'call',
          contact: 'Fiona',
          project: {
            project: 'Cheesecake'
          },
          final_deadline: parsed.parsed.final_deadline,
          status: 'pending',
          priority: 'high',
          participants: ['robin', 'ian'],
          tags: ['disaster']
        },
        id: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });
    });

    test('allows filtering by parsed properties', async () => {
      // 1. Parse and store the message
      const parsed = parser.parse(testMessage);
      await dbService.addEntry(parsed);

      // 2. Test filtering by participants
      const robinEntries = await dbService.getEntries({
        participants: new Set(['robin'])
      });
      expect(robinEntries).toHaveLength(1);
      expect(robinEntries[0].parsed.participants).toContain('robin');

      // 3. Test filtering by tags
      const disasterEntries = await dbService.getEntries({
        tags: new Set(['disaster'])
      });
      expect(disasterEntries).toHaveLength(1);
      expect(disasterEntries[0].parsed.tags).toContain('disaster');

      // 4. Test filtering by priority
      const urgentEntries = await dbService.getEntries({
        priority: new Set(['high'])
      });
      expect(urgentEntries).toHaveLength(1);
      expect(urgentEntries[0].parsed.priority).toBe('high');
    });

    test('handles date-based queries', async () => {
      // 1. Parse and store the message
      const parsed = parser.parse(testMessage);
      await dbService.addEntry(parsed);

      // 2. Get next Wednesday's date
      const nextWed = parsed.parsed.final_deadline.split('T')[0]; // Get just the date part

      // 3. Test filtering by date
      const dateEntries = await dbService.getEntries({
        date: new Set([nextWed])
      });
      
      expect(dateEntries).toHaveLength(1);
      expect(dateEntries[0].parsed.final_deadline.startsWith(nextWed)).toBe(true);
    });

    test('updates parsed entry', async () => {
      // 1. Initial parse and store
      const parsed = parser.parse(testMessage);
      const id = await dbService.addEntry(parsed);

      // 2. Update the entry
      const updates = {
        parsed: {
          ...parsed.parsed,
          status: 'complete',
          priority: 'low'
        }
      };

      await dbService.updateEntry(id, updates);

      // 3. Verify updates
      const updated = await dbService.getEntry(id);
      expect(updated.parsed.status).toBe('complete');
      expect(updated.parsed.priority).toBe('low');
      // Original parsed data should remain unchanged
      expect(updated.parsed.contact).toBe('Fiona');
      expect(updated.parsed.participants).toEqual(['robin', 'ian']);
    });
  });
}); 
