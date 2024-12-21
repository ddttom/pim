import { promises as fs } from 'fs';
import { join, dirname } from 'path';

export class ConfigManager {
  constructor(userDataPath) {
    this.configPath = join(userDataPath, 'config.json');
    this.defaultConfig = {
      dataPath: join(userDataPath, 'data')
    };
  }

  async initialize() {
    try {
      // Ensure config directory exists
      await fs.mkdir(dirname(this.configPath), { recursive: true });

      // Try to read existing config
      try {
        const data = await fs.readFile(this.configPath, 'utf8');
        this.config = { ...this.defaultConfig, ...JSON.parse(data) };
      } catch (error) {
        if (error.code === 'ENOENT') {
          // Config doesn't exist, create with defaults
          this.config = { ...this.defaultConfig };
          await this.save();
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Failed to initialize config:', error);
      throw error;
    }
  }

  async save() {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  }

  async getDataPath() {
    return this.config.dataPath;
  }

  async setDataPath(newPath) {
    this.config.dataPath = newPath;
    await this.save();
  }

  async migrateData(oldPath, newPath) {
    try {
      // Create new data directory
      await fs.mkdir(newPath, { recursive: true });

      // Copy settings.json if it exists
      try {
        const settingsData = await fs.readFile(join(oldPath, 'settings.json'), 'utf8');
        await fs.writeFile(join(newPath, 'settings.json'), settingsData);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }

      // Create empty database in new location
      await fs.writeFile(join(newPath, 'pim.db'), JSON.stringify({ entries: [] }));

      return true;
    } catch (error) {
      console.error('Failed to migrate data:', error);
      throw error;
    }
  }
}
