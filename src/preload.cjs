const { contextBridge, ipcRenderer } = require('electron');
const { IpcChannels, ErrorMessages } = require('./constants.js');

// IPC handler for main process events
contextBridge.exposeInMainWorld('electron', {
    // Settings
    getSettings: () => ipcRenderer.invoke(IpcChannels.GET_SETTINGS),
    saveSettings: (settings) => ipcRenderer.invoke(IpcChannels.SAVE_SETTINGS, settings),
    
    // Database operations
    getEntries: () => ipcRenderer.invoke(IpcChannels.GET_ENTRIES),
    saveEntry: (entry) => ipcRenderer.invoke(IpcChannels.SAVE_ENTRY, entry),
    deleteEntry: (entryId) => ipcRenderer.invoke(IpcChannels.DELETE_ENTRY, entryId),
    
    // Parser operations
    parseText: (text) => ipcRenderer.invoke(IpcChannels.PARSE_TEXT, text),
    
    // System operations
    getCurrentTheme: () => ipcRenderer.invoke(IpcChannels.GET_THEME),
    setTheme: (theme) => ipcRenderer.invoke(IpcChannels.SET_THEME, theme),
    
    // Event listeners
    onThemeChange: (callback) => {
        const subscription = (_event, theme) => callback(theme);
        ipcRenderer.on(IpcChannels.THEME_CHANGED, subscription);
        return () => ipcRenderer.removeListener(IpcChannels.THEME_CHANGED, subscription);
    },
    
    onSettingsChange: (callback) => {
        const subscription = (_event, settings) => callback(settings);
        ipcRenderer.on(IpcChannels.SETTINGS_CHANGED, subscription);
        return () => ipcRenderer.removeListener(IpcChannels.SETTINGS_CHANGED, subscription);
    },
    
    onError: (callback) => {
        const subscription = (_event, error) => callback(error);
        ipcRenderer.on(IpcChannels.ERROR, subscription);
        return () => ipcRenderer.removeListener(IpcChannels.ERROR, subscription);
    },
    
    onEntryChange: (callback) => {
        const subscription = (_event, entries) => callback(entries);
        ipcRenderer.on(IpcChannels.ENTRIES_CHANGED, subscription);
        return () => ipcRenderer.removeListener(IpcChannels.ENTRIES_CHANGED, subscription);
    }
});

// Initialize state from main process
contextBridge.exposeInMainWorld('initializeState', async () => {
    try {
        // Get initial state from main process
        const [
            settings,
            entries,
            theme
        ] = await Promise.all([
            ipcRenderer.invoke('get-settings'),
            ipcRenderer.invoke('get-entries'),
            ipcRenderer.invoke('get-theme')
        ]);

        // Return initial state
        return {
            settings,
            entries,
            theme
        };
    } catch (error) {
        console.error('Error initializing state:', error);
        throw error;
    }
});

// State synchronization with main process
let stateManager = null;

contextBridge.exposeInMainWorld('syncState', (manager) => {
    stateManager = manager;

    // Listen for theme changes
    ipcRenderer.on('theme-changed', (_event, theme) => {
        stateManager.dispatch(actions.setTheme(theme));
    });

    // Listen for settings changes
    ipcRenderer.on('settings-changed', (_event, settings) => {
        stateManager.dispatch(actions.updateSettings(settings));
    });

    // Listen for entry changes
    ipcRenderer.on('entries-changed', (_event, entries) => {
        stateManager.dispatch(actions.setEntries(entries));
    });

    // Listen for errors
    ipcRenderer.on('error', (_event, error) => {
        stateManager.dispatch(actions.setError(error));
    });

    // Subscribe to state changes that need to be synced with main process
    stateManager.subscribe((newState, prevState) => {
        // Sync theme changes
        if (newState.ui.theme !== prevState.ui.theme) {
            ipcRenderer.invoke('set-theme', newState.ui.theme);
        }

        // Sync settings changes
        if (newState.settings !== prevState.settings) {
            ipcRenderer.invoke('save-settings', newState.settings);
        }

        // Sync entry changes
        if (newState.entries.list !== prevState.entries.list) {
            // Only sync if the change originated from the renderer
            if (!newState.entries.syncing) {
                ipcRenderer.invoke('sync-entries', newState.entries.list);
            }
        }
    });
});

// Security-focused validation of IPC messages
function validateIpcMessage(channel, data) {
    // List of allowed channels
    const allowedChannels = [
        IpcChannels.THEME_CHANGED,
        IpcChannels.SETTINGS_CHANGED,
        IpcChannels.ENTRIES_CHANGED,
        IpcChannels.ERROR
    ];

    if (!allowedChannels.includes(channel)) {
        throw new Error(ErrorMessages.INVALID_CHANNEL(channel));
    }

    // Basic data validation
    if (data === undefined || data === null) {
        throw new Error(ErrorMessages.INVALID_MESSAGE);
    }

    return true;
}

// Add IPC message validation
ipcRenderer.on('message', (event, { channel, data }) => {
    try {
        if (validateIpcMessage(channel, data)) {
            // Forward validated message to appropriate handler
            ipcRenderer.emit(channel, event, data);
        }
    } catch (error) {
        console.error('IPC validation error:', error);
    }
});
