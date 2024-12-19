export default class JsonDatabaseService {
  #dbPath;
  #data = {};
  #isInitialized = false;
  #mediaDir;


  constructor(dbPath) {
    this.#dbPath = dbPath;
  }

  isInitialized() {
    return this.#isInitialized;
  }

  async initialize() {
    try {
      // Create database directory and media directory
      const dbDir = path.dirname(this.#dbPath);
      await fs.mkdir(dbDir, { recursive: true });
      this.#mediaDir = path.join(dbDir, 'media');
      await fs.mkdir(this.#mediaDir, { recursive: true });

      // Try to read existing database
      try {
        const content = await fs.readFile(this.#dbPath, 'utf8');
        this.#data = JSON.parse(content);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
        // File doesn't exist - start with empty database
        this.#data = {};
        await this.save();
      }

      this.#isInitialized = true;
      return this;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async close() {
    if (this.#isInitialized) {
      await this.save();
    }
  }

  async save() {
    try {
      // Ensure directory exists before saving
      await fs.mkdir(path.dirname(this.#dbPath), { recursive: true });
      await fs.writeFile(this.#dbPath, JSON.stringify(this.#data, null, 2));
    } catch (error) {
      console.error('Failed to save database:', error);
      throw error;
    }
  }

  async batch(operations) {
    if (!this.#isInitialized) {
      throw new Error('Database not initialized');
    }

    const originalData = JSON.parse(JSON.stringify(this.#data)); // Deep clone
    try {
      for (const operation of operations) {
        await operation(this);
      }
      await this.save();
    } catch (error) {
      // Rollback on error
      this.#data = originalData;
      await this.save();
      throw error;
    }
  }

  async addEntry(entry) {
    try {
      const id = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      
      this.#data[id] = {
        ...entry,
        created_at: timestamp,
        updated_at: timestamp
      };
      
      await this.save();
      return id;
    } catch (error) {
      console.error('Failed to add entry:', error);
      throw error;
    }
  }

  async updateEntry(id, updates) {
    if (!this.#isInitialized) {
      throw new Error('Database not initialized');
    }

    if (!this.#data[id]) {
      throw new Error('Entry not found');
    }

    // Ensure timestamps are different by waiting 1ms
    await new Promise(resolve => setTimeout(resolve, 1));
    
    this.#data[id] = {
      ...this.#data[id],
      ...updates,
      updated_at: new Date().toISOString()
    };

    await this.save();
    return this.#data[id];
  }

  async deleteEntry(id) {
    if (!this.#isInitialized) {
      throw new Error('Database not initialized');
    }

    if (!this.#data[id]) {
      throw new Error('Entry not found');
    }

    delete this.#data[id];
    await this.save();
  }

  async getEntry(id) {
    if (!this.#isInitialized) {
      throw new Error('Database not initialized');
    }

    const entry = this.#data[id];
    if (!entry) {
      throw new Error('Entry not found');
    }

    return {
      ...entry,
      id
    };
  }

  async getEntries(filters = {}) {
    if (!this.#isInitialized) {
      throw new Error('Database not initialized');
    }

    let entries = Object.entries(this.#data).map(([id, entry]) => ({
      ...entry,
      id
    }));

    // Apply filters if provided
    if (filters.status) {
      entries = entries.filter(entry => entry.parsed?.status && filters.status.has(entry.parsed.status));
    }
    if (filters.priority) {
      entries = entries.filter(entry => entry.parsed?.priority && filters.priority.has(entry.parsed.priority));
    }
    if (filters.tags) {
      entries = entries.filter(entry => 
        entry.parsed?.tags && entry.parsed.tags.some(tag => filters.tags.has(tag))
      );
    }
    if (filters.participants) {
      entries = entries.filter(entry =>
        entry.parsed?.participants && entry.parsed.participants.some(p => filters.participants.has(p))
      );
    }
    if (filters.date) {
      entries = entries.filter(entry => {
        if (!entry.parsed?.final_deadline) return false;
        const entryDate = entry.parsed.final_deadline.split('T')[0];
        return filters.date.has(entryDate);
      });
    }

    // Sort by priority (high > normal > low) if parsed data exists
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    entries.sort((a, b) => {
      const priorityA = a.parsed?.priority ? priorityOrder[a.parsed.priority] : 1;
      const priorityB = b.parsed?.priority ? priorityOrder[b.parsed.priority] : 1;
      return priorityA - priorityB;
    });

    return entries;
  }
  async addImage(entryId, imageBuffer, filename) {
    if (!this.#isInitialized) {
      throw new Error('Database not initialized');
    }

    if (!this.#data[entryId]) {
      throw new Error('Entry not found');
    }

    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const imagePath = path.join(this.#mediaDir, `${imageId}_${filename}`);
    
    await fs.writeFile(imagePath, imageBuffer);

    // Add image reference to entry
    if (!this.#data[entryId].content) {
      this.#data[entryId].content = {
        raw: '',
        markdown: '',
        images: []
      };
    }
    if (!this.#data[entryId].content.images) {
      this.#data[entryId].content.images = [];
    }
    
    const imageInfo = {
      id: imageId,
      filename,
      path: imagePath
    };
    
    this.#data[entryId].content.images.push(imageInfo);

    // Update markdown to include image
    const imageMarkdown = `![${filename}](${path.basename(imagePath)})`;
    if (!this.#data[entryId].content.markdown) {
      this.#data[entryId].content.markdown = imageMarkdown;
    } else {
      this.#data[entryId].content.markdown += '\n' + imageMarkdown;
    }

    await this.save();
    
    return imageInfo;
  }

  async deleteImage(entryId, imageId) {
    if (!this.#isInitialized) {
      throw new Error('Database not initialized');
    }

    const entry = this.#data[entryId];
    if (!entry || !entry.content.images) {
      return;
    }

    const imageIndex = entry.content.images.findIndex(img => img.id === imageId);
    if (imageIndex === -1) {
      return;
    }

    const image = entry.content.images[imageIndex];
    await fs.unlink(image.path).catch(() => {}); // Ignore if file doesn't exist
    entry.content.images.splice(imageIndex, 1);
    await this.save();
  }

  async deleteAllImages(entryId) {
    if (!this.#isInitialized) {
      throw new Error('Database not initialized');
    }

    const entry = this.#data[entryId];
    if (!entry || !entry.content.images) {
      return;
    }

    // Delete all image files
    await Promise.all(
      entry.content.images.map(img => fs.unlink(img.path).catch(() => {}))
    );

    // Clear images array
    entry.content.images = [];
    await this.save();
  }

  async backup(backupPath) {
    if (!this.#isInitialized) {
      throw new Error('Database not initialized');
    }

    // Copy all image files to backup media directory
    const backupMediaDir = path.join(path.dirname(backupPath), 'media');
    await fs.mkdir(backupMediaDir, { recursive: true });

    // Copy database file
    await fs.writeFile(backupPath, JSON.stringify(this.#data, null, 2));

    // Copy all images
    for (const entry of Object.values(this.#data)) {
      if (entry.content.images) {
        for (const image of entry.content.images) {
          const backupImagePath = path.join(backupMediaDir, `${path.basename(image.path)}`);
          await fs.copyFile(image.path, backupImagePath);
        }
      }
    }
  }
}

import { promises as fs } from 'fs';
import path from 'path';
