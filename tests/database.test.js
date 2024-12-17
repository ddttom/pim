const path = require('path');
const fs = require('fs').promises;
const JsonDatabaseService = require('../src/services/json-database');

describe('Database Service Tests', () => {
  const TEST_DIR = path.join(__dirname, '__test_data__');
  let dbService;
  let testDbPath;

  beforeAll(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  beforeEach(async () => {
    // Create unique test database file for each test
    const testId = Date.now();
    testDbPath = path.join(TEST_DIR, `pim.test.${testId}.json`);
    
    dbService = new JsonDatabaseService();
    await dbService.initialize(testDbPath);
  });

  afterEach(async () => {
    // Close database connection
    if (dbService?.isInitialized()) {
      await dbService.close();
    }
    
    // Clean up test file
    if (await fs.access(testDbPath).then(() => true).catch(() => false)) {
      await fs.unlink(testDbPath);
    }
  });

  afterAll(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  describe('Entry Operations', () => {
    test('creates new database file if not exists', async () => {
      const exists = await fs.access(testDbPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    test('adds and retrieves entry', async () => {
      const testEntry = {
        content: 'Meet with John about project',
        parsed: {
          action: 'meet',
          person: 'John',
          topic: 'project',
          status: 'pending'
        }
      };

      const id = await dbService.addEntry(testEntry);
      expect(id).toBeDefined();

      const retrieved = await dbService.getEntry(id);
      expect(retrieved.content).toBe(testEntry.content);
      expect(retrieved.parsed).toEqual(testEntry.parsed);
      expect(retrieved.created_at).toBeDefined();
      expect(retrieved.updated_at).toBeDefined();
    });

    test('updates existing entry', async () => {
      const id = await dbService.addEntry({ content: 'Original task' });
      
      const updates = {
        content: 'Updated task',
        parsed: { status: 'complete' }
      };
      
      const updated = await dbService.updateEntry(id, updates);
      expect(updated.content).toBe(updates.content);
      expect(updated.parsed.status).toBe('complete');
      expect(updated.updated_at).not.toBe(updated.created_at);
    });

    test('deletes entry', async () => {
      const id = await dbService.addEntry({ content: 'Task to delete' });
      
      const deleted = await dbService.deleteEntry(id);
      expect(deleted).toBe(true);
      
      const retrieved = await dbService.getEntry(id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Entry Filtering', () => {
    beforeEach(async () => {
      // Clear any existing entries
      dbService = new JsonDatabaseService();
      await dbService.initialize(testDbPath);
    });

    test('filters by status', async () => {
      // Add test entries first
      const entries = [
        {
          content: 'High priority task',
          parsed: { status: 'pending', priority: 'high', category: 'work' }
        },
        {
          content: 'Low priority task',
          parsed: { status: 'pending', priority: 'low', category: 'personal' }
        },
        {
          content: 'Completed task',
          parsed: { status: 'complete', priority: 'high', category: 'work' }
        }
      ];

      for (const entry of entries) {
        await dbService.addEntry(entry);
      }

      const filters = {
        status: new Set(['pending'])
      };

      const filtered = await dbService.getEntries(filters);
      expect(filtered).toHaveLength(2);
      filtered.forEach(entry => {
        expect(entry.parsed.status).toBe('pending');
      });
    });

    test('filters by multiple criteria', async () => {
      const entries = [
        {
          content: 'High priority task',
          parsed: { status: 'pending', priority: 'high', category: 'work' }
        },
        {
          content: 'Low priority task',
          parsed: { status: 'pending', priority: 'low', category: 'personal' }
        }
      ];

      for (const entry of entries) {
        await dbService.addEntry(entry);
      }

      const filters = {
        status: new Set(['pending']),
        categories: new Set(['work'])
      };

      const filtered = await dbService.getEntries(filters);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].parsed.category).toBe('work');
      expect(filtered[0].parsed.status).toBe('pending');
    });

    test('sorts entries', async () => {
      const entries = [
        { parsed: { priority: 'low' } },
        { parsed: { priority: 'high' } }
      ];

      for (const entry of entries) {
        await dbService.addEntry(entry);
      }

      const filters = {
        sort: {
          column: 'parsed.priority',
          direction: 'DESC'
        }
      };

      const filtered = await dbService.getEntries(filters);
      expect(filtered[0].parsed.priority).toBe('high');
      expect(filtered[filtered.length - 1].parsed.priority).toBe('low');
    });
  });

  describe('Batch Operations', () => {
    test('handles multiple operations in transaction', async () => {
      await dbService.batch(async () => {
        const id1 = await dbService.addEntry({ content: 'Task 1' });
        const id2 = await dbService.addEntry({ content: 'Task 2' });
        await dbService.updateEntry(id1, { content: 'Updated Task 1' });
        await dbService.deleteEntry(id2);
      });

      const entries = await dbService.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].content).toBe('Updated Task 1');
    });

    test('rolls back on error', async () => {
      const initialEntries = await dbService.getEntries();
      
      await expect(dbService.batch(async () => {
        await dbService.addEntry({ content: 'Task 1' });
        throw new Error('Test error');
      })).rejects.toThrow();

      const finalEntries = await dbService.getEntries();
      expect(finalEntries).toHaveLength(initialEntries.length);
    });
  });
}); 
