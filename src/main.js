const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const DatabaseService = require('./services/database');
const ConfigManager = require('./config/ConfigManager');
const Parser = require('./services/parser');
const Logger = require('./services/logger');

let db = null;
let mainWindow = null;
let configManager = null;

// Initialize logger
const logger = new Logger({
  level: 'info',
  prefix: 'PIM'
});

// Initialize database when app is ready
app.whenReady().then(async () => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'pim.db');
    db = new DatabaseService(dbPath);
    await db.initialize();
    
    // Create and initialize ConfigManager
    configManager = new ConfigManager(db);
    await configManager.initialize();
    
    createWindow();
  } catch (error) {
    console.error('Failed to initialize:', error);
    await dialog.showMessageBox({
      type: 'error',
      title: 'Initialization Error',
      message: 'Failed to initialize settings',
      detail: error.message,
      buttons: ['OK']
    });
    app.quit();
  }
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'PIM',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create menu template
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Entry',
          accelerator: process.platform === 'darwin' ? 'Cmd+N' : 'Ctrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-entry');
          }
        },
        { type: 'separator' },
        {
          label: 'Import from CSV',
          accelerator: process.platform === 'darwin' ? 'Cmd+I' : 'Ctrl+I',
          click: async () => {
            const { filePaths } = await dialog.showOpenDialog(mainWindow, {
              title: 'Import Database',
              filters: [
                { name: 'CSV Files', extensions: ['csv'] }
              ],
              properties: ['openFile']
            });

            if (filePaths && filePaths[0]) {
              mainWindow.webContents.send('import-db', filePaths[0]);
            }
          }
        },
        {
          label: 'Export to CSV',
          accelerator: process.platform === 'darwin' ? 'Cmd+E' : 'Ctrl+E',
          click: async () => {
            const { filePath } = await dialog.showSaveDialog(mainWindow, {
              title: 'Export Database',
              defaultPath: 'pim-export.csv',
              filters: [
                { name: 'CSV Files', extensions: ['csv'] }
              ]
            });

            if (filePath) {
              mainWindow.webContents.send('export-db', filePath);
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'toggleDevTools' },
        { role: 'reload' }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'Parser Configuration',
          accelerator: process.platform === 'darwin' ? 'Cmd+,' : 'Ctrl+,',
          click: () => {
            mainWindow.webContents.send('show-settings');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('window-all-closed', () => {
  app.quit();
});

app.on('before-quit', () => {
  if (mainWindow) {
    mainWindow.removeAllListeners('close');
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Update the settings-related IPC handlers
ipcMain.handle('get-settings', async () => {
  try {
    // Get the actual config from ConfigManager
    const parserConfig = configManager.get('parser');
    const remindersConfig = configManager.get('reminders');
    
    // Return the actual configuration
    return {
      parser: {
        maxDepth: parserConfig.maxDepth,
        ignoreFiles: parserConfig.ignoreFiles,
        outputFormat: parserConfig.outputFormat,
        tellTruth: parserConfig.tellTruth
      },
      reminders: {
        defaultMinutes: remindersConfig.defaultMinutes,
        allowMultiple: remindersConfig.allowMultiple
      }
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
});

ipcMain.handle('save-settings', async (event, newSettings) => {
  try {
    // Update each category separately
    if (newSettings.parser) {
      await configManager.updateSettings('parser', newSettings.parser);
    }
    if (newSettings.reminders) {
      await configManager.updateSettings('reminders', newSettings.reminders);
    }
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
});

// Add handler for settings export
ipcMain.handle('export-settings', async (event, filePath) => {
  try {
    if (!db.initialized) {
      await db.initialize();
    }

    const settings = await db.getAllSettings();
    await fs.promises.writeFile(filePath, JSON.stringify(settings, null, 2));

    await dialog.showMessageBox({
      type: 'info',
      title: 'Settings Exported',
      message: 'Settings have been exported successfully',
      buttons: ['OK']
    });

    return true;
  } catch (error) {
    console.error('Error exporting settings:', error);
    await dialog.showMessageBox({
      type: 'error',
      title: 'Export Error',
      message: 'Failed to export settings',
      detail: error.message,
      buttons: ['OK']
    });
    throw error;
  }
});

// Add handler for settings import
ipcMain.handle('import-settings', async (event, filePath) => {
  try {
    if (!db.initialized) {
      await db.initialize();
    }

    const fileContent = await fs.promises.readFile(filePath, 'utf8');
    const settings = JSON.parse(fileContent);

    // Verify the imported settings structure
    if (!settings || typeof settings !== 'object') {
      throw new Error('Invalid settings file format');
    }

    // Save the imported settings
    for (const [key, value] of Object.entries(settings)) {
      await db.saveSetting(key, value);
    }

    // Verify all settings were saved correctly
    const verified = await db.verifySettings();
    if (!verified) {
      throw new Error('Settings verification failed after import');
    }

    await dialog.showMessageBox({
      type: 'info',
      title: 'Settings Imported',
      message: 'Settings have been imported successfully',
      buttons: ['OK']
    });

    return true;
  } catch (error) {
    console.error('Error importing settings:', error);
    await dialog.showMessageBox({
      type: 'error',
      title: 'Import Error',
      message: 'Failed to import settings',
      detail: error.message,
      buttons: ['OK']
    });
    throw error;
  }
});

// Add this helper function at the top level
async function deletePimDb() {
  try {
    const dbPath = path.join(app.getPath('userData'), 'pim.db');
    if (fs.existsSync(dbPath)) {
      await fs.promises.unlink(dbPath);
      console.log('Successfully deleted pim.db');
    }
  } catch (error) {
    console.error('Error deleting pim.db:', error);
    throw error;
  }
}

// Add this IPC handler with the other handlers
ipcMain.handle('get-entries', async (event, filters) => {
  try {
    if (!db.initialized) {
      await db.initialize();
    }
    const entries = await db.getEntries(filters);
    return entries;
  } catch (error) {
    console.error('Error getting entries:', error);
    throw error;
  }
});

// Add these IPC handlers

ipcMain.handle('backup-settings', async (event) => {
    try {
        const { filePath } = await dialog.showSaveDialog(mainWindow, {
            title: 'Backup Settings',
            defaultPath: `pim-settings-backup-${new Date().toISOString().split('T')[0]}.json`,
            filters: [
                { name: 'JSON Files', extensions: ['json'] }
            ]
        });

        if (!filePath) return;

        await db.backupSettings(filePath);
        
        await dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Backup Complete',
            message: 'Settings backup created successfully',
            buttons: ['OK']
        });

        return true;
    } catch (error) {
        console.error('Error backing up settings:', error);
        await dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'Backup Error',
            message: 'Failed to create settings backup',
            detail: error.message,
            buttons: ['OK']
        });
        throw error;
    }
});

ipcMain.handle('restore-settings', async (event) => {
    try {
        const { response } = await dialog.showMessageBox(mainWindow, {
            type: 'warning',
            title: 'Restore Settings',
            message: 'Are you sure you want to restore settings from backup?',
            detail: 'This will overwrite all current settings. This action cannot be undone.',
            buttons: ['Cancel', 'Restore'],
            defaultId: 0,
            cancelId: 0
        });

        if (response !== 1) return;

        const { filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: 'Restore Settings from Backup',
            filters: [
                { name: 'JSON Files', extensions: ['json'] }
            ],
            properties: ['openFile']
        });

        if (!filePaths || !filePaths[0]) return;

        await db.restoreSettings(filePaths[0]);
        
        await dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Restore Complete',
            message: 'Settings restored successfully',
            buttons: ['OK']
        });

        // Refresh settings in UI
        mainWindow.webContents.send('settings-restored');

        return true;
    } catch (error) {
        console.error('Error restoring settings:', error);
        await dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'Restore Error',
            message: 'Failed to restore settings',
            detail: error.message,
            buttons: ['OK']
        });
        throw error;
    }
});

// Update the import-csv handler with more debugging
ipcMain.handle('import-csv', async (event, filePath) => {
    try {
        console.log('=== Starting CSV Import Process ===');
        console.log('Import file path:', filePath);
        
        // Read the CSV file
        const csvContent = await fs.promises.readFile(filePath, 'utf8');
        console.log('CSV content length:', csvContent.length);
        console.log('CSV content preview:', csvContent.substring(0, 500));

        // Parse CSV content
        const entries = await parseCSV(csvContent);
        console.log('Parsed entries count:', entries.length);
        console.log('First entry sample:', entries[0]);

        // Save entries to database
        if (!db.initialized) {
            console.log('Initializing database...');
            await db.initialize();
        }

        let importedCount = 0;
        for (const entry of entries) {
            console.log(`Importing entry ${importedCount + 1}/${entries.length}:`, entry);
            const result = await db.addEntry(entry);
            console.log('Entry import result:', result);
            importedCount++;
        }

        console.log(`Successfully imported ${importedCount} entries`);

        // Notify renderer
        console.log('Notifying renderer of update...');
        mainWindow.webContents.send('entries-updated');

        return {
            success: true,
            count: importedCount,
            message: `Successfully imported ${importedCount} entries`
        };
    } catch (error) {
        console.error('=== CSV Import Error ===');
        console.error('Error details:', error);
        throw error;
    }
});

// Update the parseCSV function
function parseCSV(content) {
    return new Promise((resolve, reject) => {
        try {
            console.log('Parsing CSV content...');
            console.log('Raw content:', content);
            
            // Split into lines and handle different line endings
            const lines = content.split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line.length > 0);
            
            console.log(`Found ${lines.length} non-empty lines`);
            console.log('First line:', lines[0]);
            
            if (lines.length < 2) {
                throw new Error('CSV file is empty or has no data rows');
            }

            // Parse header
            const headers = lines[0].split(',')
                .map(h => h.trim())
                .map(h => h.replace(/^"(.*)"$/, '$1')); // Remove quotes if present
            console.log('CSV headers:', headers);

            // Parse data rows
            const entries = lines.slice(1).map((line, index) => {
                // Handle quoted values properly
                const values = line.split(',').map(v => {
                    v = v.trim();
                    // Remove quotes if present
                    if (v.startsWith('"') && v.endsWith('"')) {
                        v = v.slice(1, -1);
                    }
                    return v;
                });

                const entry = {};
                headers.forEach((header, i) => {
                    if (values[i] !== undefined && values[i] !== '') {
                        // Handle date fields
                        if (header.includes('date') || header === 'datetime' || header === 'created_at') {
                            try {
                                // Try to parse and format the date
                                const date = new Date(values[i]);
                                if (!isNaN(date.getTime())) {
                                    entry[header] = date.toISOString();
                                } else {
                                    entry[header] = values[i];
                                }
                            } catch (e) {
                                console.warn(`Failed to parse date for ${header}:`, values[i]);
                                entry[header] = values[i];
                            }
                        } else {
                            entry[header] = values[i];
                        }
                    }
                });

                console.log(`Parsed row ${index + 1}:`, entry);
                return entry;
            });

            console.log(`Successfully parsed ${entries.length} entries:`, entries);
            resolve(entries);
        } catch (error) {
            console.error('Error parsing CSV:', error);
            reject(error);
        }
    });
}

// Add this IPC handler for delete operations
ipcMain.handle('delete-entry', async (event, entryId) => {
    try {
        if (!db.initialized) {
            await db.initialize();
        }
        await db.deleteEntry(entryId);
        return true;
    } catch (error) {
        console.error('Error deleting entry:', error);
        throw error;
    }
});

// Update the add-entry handler
ipcMain.handle('add-entry', async (event, content) => {
    try {
        if (!db.initialized) {
            await db.initialize();
        }
        
        // Parse the content first
        const parser = new Parser(logger);
        const parseResults = await parser.parse(content);
        
        // Get current timestamp
        const now = new Date().toISOString();
        
        // Create entry object combining raw content and parsed fields
        const entry = {
            raw_content: content,
            created_at: now,
            updated_at: now,
            action: parseResults.parsed.action || '',
            contact: parseResults.parsed.contact || '',
            project: parseResults.parsed.project?.project || '',
            final_deadline: parseResults.parsed.final_deadline || '',
            priority: parseResults.parsed.priority || '',
            status: parseResults.parsed.status?.progress || ''
        };
        
        logger.debug('Adding entry:', entry);
        const id = await db.addEntry(entry);
        return { success: true, id, entry };
    } catch (error) {
        logger.error('Error adding entry:', error);
        throw error;
    }
});

async function parseFiles(directory) {
  // Get the settings we need
  const parserConfig = configManager.get('parser');
  
  // Use the settings
  const maxDepth = parserConfig.maxDepth;        // will be 3 by default
  const filesToIgnore = parserConfig.ignoreFiles; // will be ['.git', 'node_modules'] by default
  
  // Now use these values in your code
  console.log(`Parsing files up to ${maxDepth} levels deep`);
  console.log(`Ignoring these files: ${filesToIgnore.join(', ')}`);
}

// Update the parse-text handler
ipcMain.handle('parse-text', async (event, text) => {
    try {
        const parser = new Parser(logger);
        const results = await parser.parse(text);
        return results;
    } catch (error) {
        logger.error('Parser error:', error);
        throw error;
    }
});

// Update the reparse-entry handler
ipcMain.handle('reparse-entry', async (event, { id, content, created_at }) => {
    try {
        if (!db.initialized) {
            await db.initialize();
        }
        
        // Parse the content
        const parser = new Parser(logger);
        const parseResults = await parser.parse(content);
        
        logger.debug('Parse results:', parseResults); // Add debug logging
        
        // Create entry object with preserved created_at
        const entry = {
            id,
            raw_content: content,
            created_at: created_at,
            updated_at: new Date().toISOString(),
            action: parseResults.parsed.action || '',
            contact: parseResults.parsed.contact || '',
            project: parseResults.parsed.project?.project || '',
            final_deadline: parseResults.parsed.final_deadline || '',
            priority: parseResults.parsed.priority || '',
            status: parseResults.parsed.status || 'None'  // Access status directly from parsed results
        };
        
        logger.debug('Reparsing entry:', { original: parseResults, processed: entry });
        
        // Update the entry
        await db.updateEntry(entry);
        return { success: true, entry };
    } catch (error) {
        logger.error('Error reparsing entry:', error);
        throw error;
    }
});

ipcMain.handle('update-entry-content', async (event, { id, content }) => {
    try {
        if (!db.initialized) {
            await db.initialize();
        }
        
        await db.updateEntryContent(id, content);
        return { success: true };
    } catch (error) {
        logger.error('Error updating entry content:', error);
        throw error;
    }
});