// src/renderer/components/tabs/tabManagement.js

/**
 * Tab Management Component
 * Allows for multiple simultaneous views, state persistence, and history tracking.
 */

class TabManagement {
  constructor() {
    // Initialize component state
    this.state = {
      tabs: [],
      activeTab: null,
      history: [],
    };
  }

  /**
   * Add a new tab.
   * @param {string} tabName - The name of the tab to add.
   */
  addTab(tabName) {
    if (!this.state.tabs.includes(tabName)) {
      this.state.tabs.push(tabName);
      this.setActiveTab(tabName);
      console.log('Tab Added:', tabName);
    }
  }

  /**
   * Set the active tab.
   * @param {string} tabName - The name of the tab to set as active.
   */
  setActiveTab(tabName) {
    if (this.state.tabs.includes(tabName)) {
      this.state.activeTab = tabName;
      this.state.history.push(tabName);
      console.log('Active Tab Set:', tabName);
    }
  }

  /**
   * Render the tab management system.
   */
  render() {
    const tabElement = document.createElement('div');
    tabElement.innerHTML = `
      <div class="tab-management">
        ${this.state.tabs.map(tab => `<button>${tab}</button>`).join('')}
      </div>
      <div class="active-tab">Active Tab: ${this.state.activeTab}</div>
    `;

    return tabElement;
  }
}

export default TabManagement;
