const { contextBridge, ipcRenderer } = require('electron');

// Utility functions for path operations without requiring 'path' module
const pathUtils = {
  getExtension: (filePath) => {
    const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
    return ext;
  },
  sanitizePath: (filePath) => {
    // Simple path sanitization without using path.normalize
    return filePath.replace(/^(\.\.(\/|\\|$))+/, '');
  }
};

// Expose protected methods that allow the renderer process to use
// specific electron APIs through a secure bridge
contextBridge.exposeInMainWorld(
  'electronAPI', {
    // File operations
    loadImages: async (dirPath) => {
      return await ipcRenderer.invoke('load-images', dirPath);
    },
    getMetadata: async (imagePath) => {
      return await ipcRenderer.invoke('get-metadata', imagePath);
    },
    // Window management
    toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
    // Image operations
    optimizeImage: async (imagePath) => {
      return await ipcRenderer.invoke('optimize-image', imagePath);
    },
    // Error handling
    onError: (callback) => {
      ipcRenderer.on('error', (event, message) => callback(message));
    }
  }
);

// Expose utility functions
contextBridge.exposeInMainWorld(
  'utils', {
    isValidImagePath: (filePath) => {
      const ext = pathUtils.getExtension(filePath);
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    },
    sanitizePath: pathUtils.sanitizePath
  }
);
