// Track active toasts and timeouts
const state = {
  activeToasts: new Set(),
  timeouts: new Map()
};

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type ('success', 'error', 'warning', 'info')
 * @returns {function} Cleanup function to remove toast
 */
export function showToast(message, type = 'success') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Track toast
  state.activeToasts.add(toast);
  
  // Show toast with animation
  const showTimeout = setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
  // Hide and remove toast
  const hideTimeout = setTimeout(() => {
    cleanup(toast);
  }, 3000);

  // Track timeouts
  state.timeouts.set(toast, [showTimeout, hideTimeout]);
  
  // Return cleanup function
  return () => cleanup(toast);
}

/**
 * Clean up a specific toast
 * @param {HTMLElement} toast - Toast element to clean up
 */
function cleanup(toast) {
  if (!state.activeToasts.has(toast)) return;

  // Remove show class to trigger fade out
  toast.classList.remove('show');
  
  // Remove toast after animation
  const removeTimeout = setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
    state.activeToasts.delete(toast);
  }, 300);

  // Clear timeouts
  const timeouts = state.timeouts.get(toast);
  if (timeouts) {
    timeouts.forEach(clearTimeout);
    state.timeouts.delete(toast);
  }

  // Track removal timeout
  state.timeouts.set(toast, [removeTimeout]);
}

/**
 * Clean up all active toasts
 */
export function cleanupAllToasts() {
  console.log('[Toast] Cleaning up all toasts');
  
  // Clean up each toast
  state.activeToasts.forEach(cleanup);
  
  // Clear all timeouts
  state.timeouts.forEach(timeouts => {
    timeouts.forEach(clearTimeout);
  });
  
  // Reset state
  state.activeToasts.clear();
  state.timeouts.clear();
}
