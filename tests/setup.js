import fs from 'fs/promises';
import path from 'path';

const TEST_DIR = path.join(process.cwd(), 'tests', '__test_data__');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function cleanTestDirectories() {
  try {
    // Remove existing test directory and its contents
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
      await sleep(100); // Wait for filesystem to catch up
    } catch (err) {
      // Ignore errors if directory doesn't exist
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
    
    // Create test directory and subdirectories
    await fs.mkdir(TEST_DIR, { recursive: true });
    await sleep(50);
    await fs.mkdir(path.join(TEST_DIR, 'media'), { recursive: true });
    await sleep(50);
    await fs.mkdir(path.join(TEST_DIR, 'backup'), { recursive: true });
    await sleep(50);

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
