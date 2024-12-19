const { contextBridge, ipcRenderer, clipboard } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api',
  {
    invoke: (channel, data) => {
      return ipcRenderer.invoke(channel, data);
    },
    send: (channel, data) => {
      ipcRenderer.send(channel, data);
    },
    on: (channel, func) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    copyToClipboard: async () => {
      try {
        const entries = await ipcRenderer.invoke('get-entries');
        clipboard.writeText(JSON.stringify(entries, null, 2));
        return true;
      } catch (error) {
        console.error('Failed to copy DB:', error);
        return false;
      }
    }
  }
);
