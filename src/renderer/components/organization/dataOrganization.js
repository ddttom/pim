// src/renderer/components/organization/dataOrganization.js

/**
 * Data Organization Component
 * Manages priority system, categories, tags, and custom metadata fields.
 */

class DataOrganization {
  constructor() {
    // Initialize component state
    this.state = {
      priorities: ['None', 'Low', 'Medium', 'High', 'Urgent'],
      categories: [],
      tags: [],
      metadata: {},
    };
  }

  /**
   * Add a new category.
   * @param {string} category - The category to add.
   */
  addCategory(category) {
    if (!this.state.categories.includes(category)) {
      this.state.categories.push(category);
      console.log('Category Added:', category);
    }
  }

  /**
   * Add a new tag.
   * @param {string} tag - The tag to add.
   */
  addTag(tag) {
    if (!this.state.tags.includes(tag)) {
      this.state.tags.push(tag);
      console.log('Tag Added:', tag);
    }
  }

  /**
   * Set custom metadata.
   * @param {string} key - The metadata key.
   * @param {any} value - The metadata value.
   */
  setMetadata(key, value) {
    this.state.metadata[key] = value;
    console.log('Metadata Set:', key, value);
  }
}

export default DataOrganization;
