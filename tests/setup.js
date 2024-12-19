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
  try {
    // Remove existing test directory if it exists
    await fs.rm(TEST_DIR, { recursive: true, force: true }).catch(() => {});
    
    // Create fresh test directory and media subdirectory
    await fs.mkdir(TEST_DIR, { recursive: true });
    await fs.mkdir(path.join(TEST_DIR, 'media'), { recursive: true });
    
    // Create any other required subdirectories
    await fs.mkdir(path.join(TEST_DIR, 'backup'), { recursive: true });
    await fs.mkdir(path.join(TEST_DIR, 'backup/media'), { recursive: true });
  } catch (error) {
    console.error('Test directory setup error:', error);
    throw error; // Re-throw to fail tests if setup fails
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

  // Set up jsdom mocks when not in jsdom environment
  if (!global.document) {
    global.document = {
      getElementById: jest.fn(),
      createElement: jest.fn(() => ({
        style: {},
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
          toggle: jest.fn()
        }
      }))
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
