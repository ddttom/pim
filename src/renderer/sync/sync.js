import { showToast } from '../utils/toast.js';
import { formatDate } from '../utils/dateFormatter.js';

export async function syncNow(ipcRenderer, settings) {
  try {
    const provider = document.getElementById('setting-sync-provider').value;
    if (provider === 'none') {
      showToast('Please select a sync provider', 'warning');
      return;
    }

    showToast('Syncing...', 'info');
    await ipcRenderer.invoke('sync-data', provider);
    
    settings.sync.lastSync = new Date().toISOString();
    document.getElementById('last-sync-time').textContent = 
      `Last synced: ${formatDate(settings.sync.lastSync)}`;
    
    showToast('Sync completed successfully');
  } catch (error) {
    showToast('Sync failed: ' + error.message, 'error');
  }
}

export async function createBackup(ipcRenderer) {
  try {
    await ipcRenderer.invoke('create-backup');
    showToast('Backup created successfully');
  } catch (error) {
    showToast('Failed to create backup', 'error');
  }
}

export async function restoreBackup(ipcRenderer, onRestore) {
  try {
    const result = await ipcRenderer.invoke('restore-backup');
    if (result) {
      if (onRestore) await onRestore();
      showToast('Backup restored successfully');
    }
  } catch (error) {
    showToast('Failed to restore backup', 'error');
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
  
  setInterval(() => {
    syncNow(ipcRenderer, settings).catch(error => {
      console.error('Auto sync failed:', error);
    });
  }, interval);
}
