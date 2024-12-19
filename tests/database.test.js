import { promises as fs } from 'fs';
import path from 'path';
import JsonDatabaseService from '../src/services/json-database.js';
import { TEST_DIR } from './setup.js';

async function createTestDb() {
  const testId = Date.now();
  const dbPath = path.join(TEST_DIR, `pim.test.${testId}.json`);
  const dbService = new JsonDatabaseService(dbPath);
  await dbService.initialize();
  return { dbService, dbPath };
}

describe('Database Service Tests', () => {
  let dbService;
  let dbPath;

  beforeEach(async () => {
    const db = await createTestDb();
    dbService = db.dbService;
    dbPath = db.dbPath;
  });

  afterEach(async () => {
    if (dbService?.isInitialized()) {
      await dbService.close();
    }
    if (await fs.access(dbPath).then(() => true).catch(() => false)) {
      await fs.unlink(dbPath);
    }
  });

  describe('Entry Operations', () => {
    test('creates new database file if not exists', async () => {
      expect(await fs.access(dbPath).then(() => true).catch(() => false)).toBe(true);
    });

    test('adds and retrieves entry', async () => {
      const entry = {
        content: { raw: 'Test entry' },
        parsed: { status: 'pending' }
      };

      const id = await dbService.addEntry(entry);
      const retrieved = await dbService.getEntry(id);

      expect(retrieved.content).toEqual(entry.content);
      expect(retrieved.parsed).toEqual(entry.parsed);
      expect(retrieved.created_at).toBeDefined();
      expect(retrieved.updated_at).toBeDefined();
    });

    test('updates existing entry', async () => {
      const entry = {
        content: { raw: 'Original text' },
        parsed: { status: 'pending' }
      };

      const id = await dbService.addEntry(entry);
      
      const updates = {
        content: { raw: 'Updated text', markdown: 'Updated text' },
        parsed: { status: 'complete' }
      };

      const updated = await dbService.updateEntry(id, updates);

      expect(updated.content.raw).toBe(updates.content.raw);
      expect(updated.content.markdown).toBe(updates.content.markdown);
      expect(updated.parsed.status).toBe('complete');
      expect(updated.updated_at).not.toBe(updated.created_at);
    });

    test('deletes entry', async () => {
      const entry = {
        content: { raw: 'Test entry' }
      };

      const id = await dbService.addEntry(entry);
      await dbService.deleteEntry(id);

      await expect(dbService.getEntry(id)).rejects.toThrow('Entry not found');
    });

    test('throws error for non-existent entry', async () => {
      await expect(dbService.getEntry('non_existent_id')).rejects.toThrow('Entry not found');
    });
  });

  describe('Entry Filtering', () => {
    beforeEach(async () => {
      // Add test entries
      await dbService.addEntry({
        content: { raw: 'High priority task' },
        parsed: { priority: 'high', status: 'pending' }
      });
      await dbService.addEntry({
        content: { raw: 'Normal priority task' },
        parsed: { priority: 'normal', status: 'pending' }
      });
      await dbService.addEntry({
        content: { raw: 'Low priority task' },
        parsed: { priority: 'low', status: 'complete' }
      });
    });

    test('filters by status', async () => {
      const filters = {
        status: new Set(['pending'])
      };

      const filtered = await dbService.getEntries(filters);
      expect(filtered).toHaveLength(2);
      filtered.forEach(entry => {
        expect(entry.parsed.status).toBe('pending');
      });
    });

    test('filters by priority', async () => {
      const filters = {
        priority: new Set(['high'])
      };

      const filtered = await dbService.getEntries(filters);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].parsed.priority).toBe('high');
    });

    test('sorts entries', async () => {
      const filters = {};

      const filtered = await dbService.getEntries(filters);
      expect(filtered[0].parsed.priority).toBe('high');
      expect(filtered[filtered.length - 1].parsed.priority).toBe('low');
    });
  });

  describe('Batch Operations', () => {
    test('handles multiple operations in transaction', async () => {
      // First add an entry
      const id = await dbService.addEntry({
        content: { raw: 'Task 1' }
      });

      // Then perform batch operations
      await dbService.batch([
        async (db) => {
          await db.updateEntry(id, {
            content: { raw: 'Updated Task 1' }
          });
        }
      ]);

      const entries = await dbService.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].content.raw).toBe('Updated Task 1');
    });

    test('rolls back on error', async () => {
      // Add initial entry
      const id = await dbService.addEntry({
        content: { raw: 'Original Task' }
      });

      // Attempt batch that will fail
      await expect(dbService.batch([
        async (db) => {
          await db.updateEntry(id, {
            content: { raw: 'Updated Task' }
          });
          throw new Error('Test error');
        }
      ])).rejects.toThrow('Test error');

      // Verify rollback
      const entry = await dbService.getEntry(id);
      expect(entry.content.raw).toBe('Original Task');
    });
  });
});
