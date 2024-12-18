const path = require('path');
const fs = require('fs').promises;
const JsonDatabaseService = require('../src/services/json-database');
const { TEST_DIR } = require('./setup');

describe('Rich Text and Image Support', () => {
  let dbService;
  let testDbPath;
  let testMediaDir;

  beforeEach(async () => {
    const testId = Date.now();
    testDbPath = path.join(TEST_DIR, `pim.test.${testId}.json`);
    testMediaDir = path.join(TEST_DIR, 'media');
    
    dbService = new JsonDatabaseService();
    await dbService.initialize(testDbPath);
  });

  afterEach(async () => {
    if (dbService?.isInitialized()) {
      await dbService.close();
    }
    await fs.rm(testMediaDir, { recursive: true, force: true });
    await fs.unlink(testDbPath).catch(() => {});
  });

  test('stores markdown content correctly', async () => {
    const entry = {
      raw_content: 'Test entry',
      markdown: '# Test entry\n\nWith *formatting*',
      parsed: {
        action: 'write',
        status: 'pending'
      }
    };

    const id = await dbService.addEntry(entry);
    const retrieved = await dbService.getEntry(id);

    expect(retrieved.content).toEqual({
      raw: 'Test entry',
      markdown: '# Test entry\n\nWith *formatting*',
      images: []
    });
  });

  test('handles image uploads', async () => {
    // Create test entry
    const id = await dbService.addEntry({
      raw_content: 'Entry with image',
      markdown: 'Entry with image',
      parsed: {}
    });

    // Create test image buffer
    const imageBuffer = Buffer.from('fake image data');
    const filename = 'test.png';

    // Add image to entry
    const imageInfo = await dbService.addImage(id, imageBuffer, filename);

    // Verify image was saved
    const entry = await dbService.getEntry(id);
    expect(entry.parsed.images).toHaveLength(1);
    expect(entry.parsed.images[0]).toMatchObject({
      id: expect.any(String),
      filename,
      path: expect.stringContaining('media/'),
      added_at: expect.any(String)
    });

    // Verify image file exists
    const imagePath = path.join(path.dirname(testDbPath), entry.parsed.images[0].path);
    const imageExists = await fs.access(imagePath).then(() => true).catch(() => false);
    expect(imageExists).toBe(true);

    // Verify markdown was updated
    expect(entry.content.markdown).toContain(`![${filename}](`);
  });

  test('deletes images when entry is deleted', async () => {
    // Create entry with image
    const id = await dbService.addEntry({
      raw_content: 'Entry to delete',
      markdown: 'Entry to delete',
      parsed: {}
    });

    const imageBuffer = Buffer.from('fake image data');
    const imageInfo = await dbService.addImage(id, imageBuffer, 'test.png');
    
    // Get image path
    const entry = await dbService.getEntry(id);
    const imagePath = path.join(path.dirname(testDbPath), entry.parsed.images[0].path);
    
    // Delete entry
    await dbService.deleteEntry(id);
    
    // Verify image was deleted
    const imageExists = await fs.access(imagePath).then(() => true).catch(() => false);
    expect(imageExists).toBe(false);
  });

  test('backs up images with database', async () => {
    // Create entry with image
    const id = await dbService.addEntry({
      raw_content: 'Entry to backup',
      markdown: 'Entry to backup',
      parsed: {}
    });

    const imageBuffer = Buffer.from('fake image data');
    await dbService.addImage(id, imageBuffer, 'test.png');

    // Create backup
    const backupPath = path.join(TEST_DIR, 'backup.json');
    await dbService.backup(backupPath);

    // Verify backup media directory exists
    const backupMediaDir = path.join(path.dirname(backupPath), 'media');
    const mediaExists = await fs.access(backupMediaDir).then(() => true).catch(() => false);
    expect(mediaExists).toBe(true);

    // Verify image was backed up
    const entry = await dbService.getEntry(id);
    const backupImagePath = path.join(path.dirname(backupPath), entry.parsed.images[0].path);
    const imageExists = await fs.access(backupImagePath).then(() => true).catch(() => false);
    expect(imageExists).toBe(true);
  });
}); 
