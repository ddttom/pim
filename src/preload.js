import { contextBridge, ipcRenderer } from 'electron';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    invoke: async (channel, ...args) => {
      const validChannels = [
        'get-settings',
        'update-settings',
        'get-entries',
        'add-entry',
        'update-entry',
        'delete-entry',
        'add-image',
        'create-backup',
        'restore-backup',
        'sync-data'
      ];
      if (validChannels.includes(channel)) {
        return await ipcRenderer.invoke(channel, ...args);
      }
      throw new Error(`Invalid channel: ${channel}`);
    },
    on: (channel, func) => {
      const validChannels = ['settings-loaded'];
      if (validChannels.includes(channel)) {
        // Strip event as it includes `sender` and other internal electron stuff
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    removeAllListeners: (channel) => {
      const validChannels = ['settings-loaded'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeAllListeners(channel);
      }
    }
  }
);
