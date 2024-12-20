import { showToast } from '../utils/toast.js';
import { formatDate } from '../utils/dateFormatter.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('SyncUI');

export async function syncNow(ipcRenderer, settings) {
  try {
    const provider = document.getElementById('setting-sync-provider').value;
    if (provider === 'none') {
      showToast('Please select a sync provider', 'warning');
      return;
    }

    if (!settings.sync.enabled) {
      showToast('Sync is not enabled in settings', 'warning');
      return;
    }

    showToast('Syncing...', 'info');
    
    // Call sync service through IPC
    const result = await ipcRenderer.invoke('sync-data', {
      provider,
      settings: {
        enabled: settings.sync.enabled,
        provider: settings.sync.provider,
        autoSync: settings.sync.autoSync,
        syncInterval: settings.sync.syncInterval
      }
    });

    if (result.success) {
      // Update last sync time
      settings.sync.lastSync = new Date().toISOString();
      await ipcRenderer.invoke('update-settings', settings);
      
      // Update UI
      const lastSyncElement = document.getElementById('last-sync-time');
      if (lastSyncElement) {
        lastSyncElement.textContent = `Last synced: ${formatDate(settings.sync.lastSync)}`;
      }
      
      showToast('Sync completed successfully');
    } else {
      throw new Error(result.error || 'Sync failed');
    }
  } catch (error) {
    showToast('Sync failed: ' + error.message, 'error');
    throw error; // Re-throw for auto-sync handling
  }
}

export async function createBackup(ipcRenderer) {
  try {
    const result = await ipcRenderer.invoke('create-backup');
    if (result.success) {
      showToast('Backup created successfully');
      return result.paths;
    } else {
      throw new Error(result.error || 'Backup failed');
    }
  } catch (error) {
    showToast('Failed to create backup: ' + error.message, 'error');
    throw error;
  }
}

export async function restoreBackup(ipcRenderer, onRestore) {
  try {
    // Open file dialog to select backup
    const result = await ipcRenderer.invoke('show-open-dialog', {
      title: 'Select Backup File',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths.length) {
      return;
    }

    const backupPath = result.filePaths[0];
    const restoreResult = await ipcRenderer.invoke('restore-backup', backupPath);
    
    if (restoreResult.success) {
      if (onRestore) await onRestore();
      showToast('Backup restored successfully');
      return true;
    } else {
      throw new Error(restoreResult.error || 'Restore failed');
    }
  } catch (error) {
    showToast('Failed to restore backup: ' + error.message, 'error');
    throw error;
  }
}

export function setupAutoSync(settings, ipcRenderer) {
  if (!settings.sync.enabled || !settings.sync.autoSync) return;

  const intervals = {
    hourly: 60 * 60 * 1000,
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000
  };

  const interval = intervals[settings.sync.syncInterval] || intervals.daily;
  
  // Clear any existing auto-sync interval
  if (window.autoSyncInterval) {
    clearInterval(window.autoSyncInterval);
  }
  
  // Set up new auto-sync interval
  window.autoSyncInterval = setInterval(async () => {
    try {
      await syncNow(ipcRenderer, settings);
    } catch (error) {
      console.error('Auto sync failed:', error);
      // Don't show toast for auto-sync failures to avoid spam
      logger.error('Auto sync failed:', { error });
    }
  }, interval);

  // Store initial sync time
  if (!settings.sync.lastSync) {
    settings.sync.lastSync = new Date().toISOString();
    ipcRenderer.invoke('update-settings', settings).catch(error => {
      console.error('Failed to update last sync time:', error);
    });
  }
}
