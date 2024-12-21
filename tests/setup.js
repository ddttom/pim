import path from 'path';
import { promises as fs } from 'fs';

export const TEST_DIR = path.join(process.cwd(), 'tests/__test_data__');

// Mock Electron modules before any imports
import { jest } from '@jest/globals';
jest.mock('electron', () => ({
  app: {
    getPath: jest.fn().mockReturnValue('tests/__test_data__')
  },
  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn(),
    send: jest.fn()
  },
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn()
  }
}));

async function cleanTestDirectories() {
  // Remove existing test directory if it exists
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (err) {
    // Ignore errors if directory doesn't exist
  }
    
  // Create test directories sequentially to ensure parent dirs exist
  const directories = [
    TEST_DIR,
    path.join(TEST_DIR, 'media'),
    path.join(TEST_DIR, 'backup'),
    path.join(TEST_DIR, 'backup/media')
  ];

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create directory ${dir}:`, error);
      throw error; // Fail test setup if directories can't be created
    }
  }

  // Create empty test database file
  const dbPath = path.join(TEST_DIR, 'pim.test.json');
  try {
    await fs.writeFile(dbPath, '{}');
  } catch (error) {
    console.error('Failed to create test database:', error);
    throw error;
  }
}

// Set up test environment
beforeAll(async () => {
  // Set up test directories
  await cleanTestDirectories();
  
  // Set up global mocks
  global.window = {
    api: {
      invoke: jest.fn(),
      on: jest.fn(),
      send: jest.fn()
    }
  };

  // Set up jsdom mocks
  if (typeof document !== 'undefined') {
    // In jsdom environment
    document.body.innerHTML = ''; // Clear any existing content
    
    // Mock CSS loading
    const head = document.getElementsByTagName('head')[0];
    const style = document.createElement('style');
    style.type = 'text/css';
    head.appendChild(style);
  } else {
    // In node environment
    global.document = {
      getElementById: jest.fn(),
      createElement: jest.fn(() => ({
        style: {},
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
          toggle: jest.fn()
        }
      })),
      getElementsByTagName: jest.fn(() => []),
      body: { innerHTML: '' }
    };
  }
});

beforeEach(async () => {
  await cleanTestDirectories();
  jest.clearAllMocks();
});

afterAll(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true }).catch(() => {});
});
