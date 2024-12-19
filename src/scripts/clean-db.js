import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

async function cleanDatabase() {
  try {
    const userDataPath = process.env.APPDATA || 
      (process.platform === 'darwin' ? join(homedir(), 'Library/Application Support/Electron') : join(homedir(), '.config'));
    
    const dbPath = join(userDataPath, 'pim', 'pim.db');
    const mediaPath = join(userDataPath, 'pim', 'media');

    // Delete database file
    await fs.unlink(dbPath).catch(() => {});
    
    // Delete media directory
    await fs.rm(mediaPath, { recursive: true, force: true }).catch(() => {});

    console.log('Database and media files cleaned successfully');
  } catch (error) {
    console.error('Failed to clean database:', error);
    process.exit(1);
  }
}

cleanDatabase();
