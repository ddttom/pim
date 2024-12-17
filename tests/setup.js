// Mock Electron's app module
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn().mockReturnValue('tests/__test_data__')
  }
}));

// Ensure test directory exists
const path = require('path');
const fs = require('fs').promises;

const TEST_DIR = path.join(__dirname, '__test_data__');

beforeAll(async () => {
  await fs.mkdir(TEST_DIR, { recursive: true });
});

// Clean up after all tests
afterAll(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

// Export TEST_DIR for use in tests
module.exports = {
  TEST_DIR
}; 
