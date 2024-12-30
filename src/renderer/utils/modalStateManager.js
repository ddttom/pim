/**
 * Modal State Manager
 * Handles state management for all modals in the application
 */
class ModalStateManager {
  constructor() {
    this.state = {
      activeModals: new Map(), // Tracks all active modals
      history: [],             // Modal history for state tracking
      zIndexCounter: 1000,     // Manages modal stacking
      isUpdating: false        // Guard against recursive updates
    };

    // Event handlers
    this.handlers = new Map();
    
    // Bind methods
    this.registerModal = this.registerModal.bind(this);
    this.unregisterModal = this.unregisterModal.bind(this);
    this.getModalState = this.getModalState.bind(this);
    this.updateModalState = this.updateModalState.bind(this);
    this.cleanup = this.cleanup.bind(this);
  }

  /**
   * Register a new modal instance
   * @param {string} id Unique modal identifier
   * @param {object} initialState Initial modal state
   * @returns {number} Z-index for the modal
   */
  registerModal(id, initialState = {}) {
    if (this.state.activeModals.has(id)) {
      console.warn(`Modal ${id} already registered`);
      return this.state.activeModals.get(id).zIndex;
    }

    const zIndex = this.state.zIndexCounter++;
    const modalState = {
      ...initialState,
      id,
      zIndex,
      timestamp: Date.now(),
      isVisible: false
    };

    this.state.activeModals.set(id, modalState);
    this.state.history.push({
      action: 'register',
      id,
      timestamp: Date.now(),
      state: { ...modalState }
    });

    // Notify listeners without triggering state updates
    this.notifyStateChange('register', modalState);

    return zIndex;
  }

  /**
   * Unregister a modal instance and cleanup resources
   * @param {string} id Modal identifier
   */
  unregisterModal(id) {
    if (!this.state.activeModals.has(id)) {
      console.warn(`Modal ${id} not found`);
      return;
    }

    const modalState = this.state.activeModals.get(id);
    this.state.activeModals.delete(id);
    this.state.history.push({
      action: 'unregister',
      id,
      timestamp: Date.now(),
      state: { ...modalState }
    });

    // Notify listeners without triggering state updates
    this.notifyStateChange('unregister', modalState);

    // Cleanup handlers
    if (this.handlers.has(id)) {
      this.handlers.delete(id);
    }
  }

  /**
   * Get current state of a modal
   * @param {string} id Modal identifier
   * @returns {object|null} Modal state or null if not found
   */
  getModalState(id) {
    return this.state.activeModals.get(id) || null;
  }

  /**
   * Update state of a modal
   * @param {string} id Modal identifier
   * @param {object} updates State updates to apply
   */
  updateModalState(id, updates) {
    // Guard against recursive updates
    if (this.state.isUpdating) {
      console.warn('Preventing recursive state update for modal:', id);
      return;
    }

    if (!this.state.activeModals.has(id)) {
      console.warn(`Modal ${id} not found`);
      return;
    }

    try {
      this.state.isUpdating = true;

      const currentState = this.state.activeModals.get(id);
      const newState = {
        ...currentState,
        ...updates,
        timestamp: Date.now()
      };

      // Only update if state actually changed
      if (JSON.stringify(currentState) === JSON.stringify(newState)) {
        console.log('No state change detected for modal:', id);
        return;
      }

      this.state.activeModals.set(id, newState);
      this.state.history.push({
        action: 'update',
        id,
        timestamp: Date.now(),
        state: { ...newState }
      });

      // Notify listeners
      this.notifyStateChange('update', newState);
    } finally {
      this.state.isUpdating = false;
    }
  }

  /**
   * Subscribe to state changes for a modal
   * @param {string} id Modal identifier
   * @param {function} handler Callback function
   */
  subscribe(id, handler) {
    if (!this.handlers.has(id)) {
      this.handlers.set(id, new Set());
    }
    this.handlers.get(id).add(handler);
  }

  /**
   * Unsubscribe from state changes
   * @param {string} id Modal identifier
   * @param {function} handler Callback function
   */
  unsubscribe(id, handler) {
    if (this.handlers.has(id)) {
      this.handlers.get(id).delete(handler);
      if (this.handlers.get(id).size === 0) {
        this.handlers.delete(id);
      }
    }
  }

  /**
   * Notify subscribers of state changes
   * @param {string} action Action type
   * @param {object} state Updated state
   */
  notifyStateChange(action, state) {
    const id = state.id;
    if (this.handlers.has(id)) {
      this.handlers.get(id).forEach(handler => {
        try {
          handler(action, state);
        } catch (error) {
          console.error(`Error in modal state handler for ${id}:`, error);
        }
      });
    }
  }

  /**
   * Clean up resources for all modals
   */
  cleanup() {
    // Store final state for debugging
    const finalState = {
      activeModals: Array.from(this.state.activeModals.entries()),
      history: this.state.history
    };
    console.log('Modal state manager cleanup. Final state:', finalState);

    // Cleanup all modals
    for (const [id, state] of this.state.activeModals) {
      this.unregisterModal(id);
    }

    // Reset state
    this.state.activeModals.clear();
    this.state.history = [];
    this.state.zIndexCounter = 1000;
    this.state.isUpdating = false;
    this.handlers.clear();
  }

  /**
   * Get debug information about current state
   * @returns {object} Debug information
   */
  getDebugInfo() {
    return {
      activeModals: Array.from(this.state.activeModals.entries()),
      history: this.state.history,
      zIndexCounter: this.state.zIndexCounter,
      isUpdating: this.state.isUpdating,
      handlers: Array.from(this.handlers.entries()).map(([id, handlers]) => ({
        id,
        handlerCount: handlers.size
      }))
    };
  }
}

// Create singleton instance
const modalStateManager = new ModalStateManager();

// Handle cleanup on page unload
window.addEventListener('unload', () => {
  modalStateManager.cleanup();
});

export default modalStateManager;
