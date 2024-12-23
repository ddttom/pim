import fs from 'fs/promises';
import path from 'path';

const TEST_DIR = path.join(process.cwd(), 'tests', '__test_data__');

async function cleanTestDirectories() {
  try {
    // Remove existing test directory and its contents
    await fs.rm(TEST_DIR, { recursive: true, force: true }).catch(() => {});
    
    // Create test directory
    await fs.mkdir(TEST_DIR, { recursive: true });
    
    // Create subdirectories in sequence
    const subdirs = ['media', 'backup'];
    for (const dir of subdirs) {
      await fs.mkdir(path.join(TEST_DIR, dir), { recursive: true });
    }

    // Create empty test database
    const dbPath = path.join(TEST_DIR, 'pim.test.json');
    await fs.writeFile(dbPath, '{}');
  } catch (error) {
    console.error('Failed to setup test environment:', error);
    throw error;
  }
}

// Run before each test to ensure clean state
beforeEach(async () => {
  await cleanTestDirectories();
});

// Clean up after all tests
afterAll(async () => {
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (error) {
    console.error('Failed to cleanup test environment:', error);
  }
});
