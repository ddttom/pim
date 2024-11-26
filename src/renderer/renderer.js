const { ipcRenderer } = require('electron');

console.log('=== Starting renderer.js ===');

// Keep all function declarations at the top
function showSettingsForm() {
    console.log('Showing settings form');
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        hideAllForms();
        settingsForm.classList.remove('hidden');
        populateSettingsForm();
    }
}

function hideSettingsForm() {
    console.log('Hiding settings form');
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.classList.add('hidden');
    }
}

function hideAllForms() {
    console.log('Hiding all forms');
    const forms = document.querySelectorAll('.form');
    forms.forEach(form => form.classList.add('hidden'));
}

async function populateSettingsForm() {
    console.log('=== Populating Settings Form ===');
    const settingsForm = document.getElementById('settings-form');
    const settingsContainer = document.getElementById('settings-container');
    
    try {
        const settings = await ipcRenderer.invoke('get-settings');
        console.log('Retrieved settings:', settings);
        
        if (!settings || Object.keys(settings).length === 0) {
            console.error('No settings received');
            settingsContainer.innerHTML = '<div class="error">No settings available</div>';
            return;
        }

        // Generate and set HTML
        settingsForm.innerHTML = generateSettingsHTML(settings);
        
        // Add event listeners after HTML is set
        console.log('Adding settings form event listeners');
        
        // Add close button listener
        const closeBtn = document.getElementById('settings-close');
        if (closeBtn) {
            console.log('Adding close button listener');
            closeBtn.addEventListener('click', () => {
                console.log('Close button clicked');
                hideSettingsForm();
            });
        }

        const cancelBtn = document.getElementById('settings-cancel');
        if (cancelBtn) {
            console.log('Adding cancel button listener');
            cancelBtn.addEventListener('click', () => {
                console.log('Cancel button clicked');
                hideSettingsForm();
            });
        }

        const saveBtn = document.getElementById('settings-save');
        if (saveBtn) {
            console.log('Adding save button listener');
            saveBtn.addEventListener('click', async () => {
                console.log('Save button clicked');
                try {
                    const newSettings = collectSettingsFromForm();
                    await ipcRenderer.invoke('save-settings', newSettings);
                    hideSettingsForm();
                    showSuccess('Settings saved successfully');
                } catch (error) {
                    console.error('Error saving settings:', error);
                    showError('Failed to save settings: ' + error.message);
                }
            });
        }

    } catch (error) {
        console.error('Error loading settings:', error);
        settingsContainer.innerHTML = `<div class="error">Error loading settings: ${error.message}</div>`;
    }
}

// Move all initialization code into DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM Content Loaded ===');
    
    // Set up settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        console.log('Found settings button, adding click listener');
        settingsBtn.addEventListener('click', () => {
            console.log('Settings button clicked');
            showSettingsForm();
        });
    } else {
        console.error('Settings button not found');
    }

    // Debug elements
    debugElement('settings-btn');
    debugElement('settings-form');
    debugElement('settings-container');
});

// Keep the debug helper
function debugElement(id) {
    const element = document.getElementById(id);
    console.log(`Debug element "${id}":`, {
        exists: !!element,
        display: element ? getComputedStyle(element).display : 'N/A',
        classes: element ? element.className : 'N/A',
        parent: element ? element.parentElement : 'N/A'
    });
    return element;
}

// Add this function to generate settings HTML
function generateSettingsHTML(settings) {
    console.log('Generating settings HTML for:', settings);
    
    if (!settings || typeof settings !== 'object') {
        console.error('Invalid settings object:', settings);
        return '<div class="error">No settings available</div>';
    }

    // Process settings for copy functionality
    const processedSettings = JSON.stringify(settings, null, 2);

    return `
        <div class="form-content">
            <div class="settings-header">
                <h2>Settings</h2>
                <button class="close-btn" id="settings-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div id="settings-container">
                ${formatSettingsGroups(settings)}
            </div>
            
            <div class="settings-footer">
                <button class="settings-cancel-btn" id="settings-cancel">Cancel</button>
                <button class="settings-save-btn" id="settings-save">Save Changes</button>
            </div>
        </div>
    `;
}

// Add helper function to format settings groups
function formatSettingsGroups(settings) {
    const groups = [];
    
    // Format patterns group
    if (settings.patterns) {
        groups.push(formatSettingsGroup('Patterns', settings.patterns));
    }
    
    // Format categories group
    if (settings.categories) {
        groups.push(formatSettingsGroup('Categories', settings.categories));
    }
    
    // Format other groups as needed
    if (settings.defaultTimes) {
        groups.push(formatSettingsGroup('Default Times', settings.defaultTimes));
    }
    
    if (settings.defaultReminders) {
        groups.push(formatSettingsGroup('Default Reminders', settings.defaultReminders));
    }

    return groups.join('');
}

// Add helper function to format a single settings group
function formatSettingsGroup(title, settings) {
    const items = Object.entries(settings).map(([key, value]) => {
        const displayValue = value instanceof RegExp ? value.toString() : 
                           Array.isArray(value) ? value.join(', ') :
                           typeof value === 'object' ? JSON.stringify(value, null, 2) :
                           value;
        
        return `
            <div class="setting-item">
                <label for="${key}">${formatLabel(key)}</label>
                <input type="text" 
                       id="${key}" 
                       name="${key}" 
                       class="setting-input ${value instanceof RegExp ? 'code-input' : ''}"
                       value="${escapeHtml(displayValue)}"
                />
            </div>
        `;
    });

    return `
        <div class="settings-group">
            <h3>${title}</h3>
            <div class="settings-grid">
                ${items.join('')}
            </div>
        </div>
    `;
}

// Add helper function to format labels
function formatLabel(key) {
    return key
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .trim();
}

// Add helper function to escape HTML
function escapeHtml(str) {
    if (typeof str !== 'string') {
        str = String(str);
    }
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Update the collectSettingsFromForm function
function collectSettingsFromForm() {
    console.log('=== Collecting Settings From Form ===');
    const settings = {};
    const inputs = document.querySelectorAll('.setting-input');
    console.log(`Found ${inputs.length} setting inputs`);

    inputs.forEach(input => {
        const keyPath = input.name.split('.');
        let value = input.value.trim();
        console.log(`Processing setting ${input.name}:`, {
            keyPath,
            rawValue: value,
            inputType: input.type
        });

        try {
            // Check if it's a RegExp
            if (value.startsWith('/') && value.lastIndexOf('/') > 0) {
                const lastSlash = value.lastIndexOf('/');
                const pattern = value.slice(1, lastSlash);
                const flags = value.slice(lastSlash + 1);
                value = {
                    type: 'regex',
                    pattern: pattern,
                    flags: flags
                };
                console.log(`Converted RegExp ${input.name}:`, value);
            } else if (value.startsWith('[') || value.startsWith('{')) {
                // Try to parse as JSON
                try {
                    value = JSON.parse(value);
                    console.log(`Parsed JSON ${input.name}:`, value);
                } catch (e) {
                    console.warn(`Failed to parse JSON for ${input.name}:`, e);
                }
            } else if (value.includes('\n')) {
                // Handle multiline input as array
                value = value.split('\n')
                    .map(item => item.trim())
                    .filter(item => item)
                    .map(item => {
                        if (item.startsWith('/') && item.includes('/')) {
                            const lastSlash = item.lastIndexOf('/');
                            return {
                                type: 'regex',
                                pattern: item.slice(1, lastSlash),
                                flags: item.slice(lastSlash + 1)
                            };
                        }
                        try {
                            return JSON.parse(item);
                        } catch {
                            return item;
                        }
                    });
                console.log(`Processed list ${input.name}:`, value);
            }
        } catch (e) {
            console.error(`Error processing setting ${input.name}:`, e);
        }

        // Build nested structure
        let current = settings;
        for (let i = 0; i < keyPath.length; i++) {
            const key = keyPath[i];
            if (i === keyPath.length - 1) {
                current[key] = value;
                console.log(`Set value for ${key}:`, value);
            } else {
                current[key] = current[key] || {};
                current = current[key];
                console.log(`Created/accessed nested object for ${key}`);
            }
        }
    });

    console.log('Final collected settings:', settings);
    return settings;
}

// Add this helper function to show success/error messages
function showSuccess(message) {
    console.log('Success:', message);
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

function showError(message) {
    console.error('Error:', message);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Add these functions for new entry handling
function showNewEntryForm(editData = null) {
    console.log('=== Showing Entry Form ===', editData);
    const entryForm = document.getElementById('entry-form');
    if (!entryForm) {
        console.error('Entry form not found');
        return;
    }

    // Create the form content
    const formHTML = `
        <div class="form-content">
            <div class="form-header">
                <h2>${editData ? 'Edit Entry' : 'New Entry'}</h2>
                <button class="close-btn" id="entry-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <textarea 
                id="entry-input" 
                name="content"
                placeholder="Enter your task (e.g., 'Call John about Project X tomorrow at 2pm')"
                rows="3"
            >${editData ? editData.content : ''}</textarea>
            <div class="form-actions">
                <button class="parse-btn" id="parse-btn">
                    <i class="fas fa-magic"></i>
                    Parse
                </button>
                <div class="form-buttons">
                    <button class="settings-cancel-btn" id="entry-cancel">Cancel</button>
                    <button class="settings-save-btn" id="entry-save">Save</button>
                </div>
            </div>
        </div>
    `;

    entryForm.innerHTML = formHTML;
    if (editData) {
        entryForm.dataset.editId = editData.id;
        entryForm.dataset.createdAt = editData.created_at;
    } else {
        delete entryForm.dataset.editId;
        delete entryForm.dataset.createdAt;
    }

    hideAllForms();
    entryForm.classList.remove('hidden');

    // Add event listeners
    setupFormEventListeners(editData);
}

function hideNewEntryForm() {
    console.log('Hiding new entry form');
    const entryForm = document.getElementById('entry-form');
    if (entryForm) {
        entryForm.classList.add('hidden');
        entryForm.innerHTML = '';
    }
}

async function handleSaveEntry(editData) {
    const input = document.getElementById('entry-input');
    if (!input) {
        console.error('Entry input not found');
        showError('Entry form not properly initialized');
        return;
    }

    const content = input.value.trim();
    if (!content) {
        console.log('No content entered');
        showError('Please enter a task');
        return;
    }

    try {
        let result;
        if (editData) {
            // Handle edit
            result = await ipcRenderer.invoke('reparse-entry', {
                id: editData.id,
                content: content,
                created_at: editData.created_at
            });
        } else {
            // Handle new entry
            result = await ipcRenderer.invoke('add-entry', content);
        }

        console.log('Entry saved:', result);
        hideNewEntryForm();
        await loadEntries();
        showSuccess(editData ? 'Entry updated successfully' : 'Entry added successfully');
    } catch (error) {
        console.error('Error saving entry:', error);
        showError('Failed to save entry: ' + error.message);
    }
}

// Update the loadEntries function
async function loadEntries() {
    try {
        console.log('=== Loading Entries ===');
        console.log('Active filters:', activeFilters);
        
        const entries = await ipcRenderer.invoke('get-entries', {
            ...activeFilters,
            sort: currentSort
        });
        
        console.log('Entries received:', entries);
        console.log('Entries count:', entries?.length || 0);
        
        if (!entries || entries.length === 0) {
            console.log('No entries found, showing empty state');
            renderEmptyState();
            return;
        }
        
        console.log('Rendering entries to UI...');
        renderTableView(entries);
        console.log('Entries rendered successfully');
    } catch (error) {
        console.error('=== Load Entries Error ===');
        console.error('Error details:', error);
        showError('Failed to load entries: ' + error.message);
    }
}

// Add these variables at the top of the file
const activeFilters = {};
const currentSort = { column: 'final_deadline', direction: 'desc' };

// Add this to your initialization code
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== DOM Content Loaded ===');
    
    // Set up new entry button
    const newEntryBtn = document.getElementById('new-entry-btn');
    if (newEntryBtn) {
        console.log('Found new entry button, adding click listener');
        newEntryBtn.addEventListener('click', () => {
            console.log('New entry button clicked');
            showNewEntryForm();
        });
    } else {
        console.error('New entry button not found');
    }

    // Set up settings button
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        console.log('Found settings button, adding click listener');
        settingsBtn.addEventListener('click', () => {
            console.log('Settings button clicked');
            showSettingsForm();
        });
    } else {
        console.error('Settings button not found');
    }

    // Load initial entries
    console.log('Loading initial entries...');
    await loadEntries();
    console.log('Initial entries loaded');
});

// Update the renderTableView function
function renderTableView(entries) {
    console.log('=== Rendering Table View ===');
    const tableBody = document.querySelector('#entries-table tbody');
    if (!tableBody) {
        console.error('Table body element not found');
        return;
    }

    console.log(`Building table HTML for ${entries.length} entries`);
    const html = entries.map((entry, index) => {
        console.log(`Processing entry ${index + 1}:`, entry);
        
        // Check if deadline is overdue
        const isOverdue = entry.final_deadline ? 
            new Date(entry.final_deadline) <= new Date() : 
            false;
        
        // Format priority to be blank if 'None'
        const priority = entry.priority === 'None' ? '' : (entry.priority || '');
        
        return `
            <tr data-id="${entry.id}"
                data-created-at="${entry.created_at || ''}" 
                data-updated-at="${entry.updated_at || ''}">
                <td class="content-cell">${entry.raw_content || ''}</td>
                <td>${entry.action || ''}</td>
                <td>${entry.contact || ''}</td>
                <td>${entry.project || ''}</td>
                <td class="${isOverdue ? 'overdue' : ''}">${formatDate(entry.final_deadline) || ''}</td>
                <td>${priority}</td>
                <td>${entry.status || ''}</td>
                <td class="actions-cell">
                    <button class="edit-btn" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-id="${entry.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="expand-btn" data-id="${entry.id}">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    console.log('Setting table HTML');
    tableBody.innerHTML = html;
    console.log('Table HTML set');

    // Add event listeners
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDelete);
    });

    document.querySelectorAll('.expand-btn').forEach(button => {
        button.addEventListener('click', handleExpand);
    });

    // Add edit button listeners
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', handleEdit);
    });
}

// Add the handleEdit function
async function handleEdit(event) {
    const button = event.target.closest('.edit-btn');
    const row = button.closest('tr');
    const contentCell = row.querySelector('.content-cell');
    const entryId = row.dataset.id;
    const createdAt = row.dataset.createdAt;
    const content = contentCell.textContent.trim();

    // Show the entry form with existing content
    showNewEntryForm({
        id: entryId,
        content: content,
        created_at: createdAt,
        isEdit: true
    });
}

// Add setupFormEventListeners function
function setupFormEventListeners(editData) {
    const closeBtn = document.getElementById('entry-close');
    const cancelBtn = document.getElementById('entry-cancel');
    const saveBtn = document.getElementById('entry-save');
    const parseBtn = document.getElementById('parse-btn');
    const input = document.getElementById('entry-input');

    if (closeBtn) {
        closeBtn.addEventListener('click', hideNewEntryForm);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideNewEntryForm);
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => handleSaveEntry(editData));
    }

    if (parseBtn) {
        parseBtn.addEventListener('click', async () => {
            const content = input.value;
            try {
                const results = await ipcRenderer.invoke('parse-text', content);
                parserResults.textContent = JSON.stringify(results, null, 2);
                parserDialog.classList.remove('hidden');
            } catch (error) {
                console.error('Parser error:', error);
                showError('Error parsing text: ' + error.message);
            }
        });
    }

    if (input) {
        input.focus();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSaveEntry(editData);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                hideNewEntryForm();
            }
        });
    }
}

// Add the handleReparse function
async function handleReparse(event) {
    const button = event.target.closest('.reparse-btn');
    const row = button.closest('tr');
    const contentCell = row.querySelector('.content-cell');
    const entryId = row.dataset.id;
    const createdAt = row.dataset.createdAt;

    try {
        // Get the current content
        const content = contentCell.textContent.trim();
        
        // Parse the content while preserving created_at
        const results = await ipcRenderer.invoke('reparse-entry', {
            id: entryId,
            content: content,
            created_at: createdAt
        });

        // Refresh the entries list
        await loadEntries();
        
        showSuccess('Entry reparsed successfully');
    } catch (error) {
        console.error('Error reparsing entry:', error);
        showError('Failed to reparse entry: ' + error.message);
    }
}

// Update the handleCellEdit function
async function handleCellEdit(cell) {
    const row = cell.closest('tr');
    const entryId = row.dataset.id;
    const newContent = cell.textContent.trim();
    const createdAt = row.dataset.createdAt;

    try {
        // Reparse the content while preserving created_at
        const results = await ipcRenderer.invoke('reparse-entry', {
            id: entryId,
            content: newContent,
            created_at: createdAt
        });

        // Refresh the entries list
        await loadEntries();
        showSuccess('Entry updated successfully');
    } catch (error) {
        console.error('Error updating entry:', error);
        showError('Failed to update entry: ' + error.message);
        // Reload entries to revert changes
        await loadEntries();
    }
}

// Add this helper function to format dates
function formatDate(dateStr) {
    if (!dateStr) return '';
    
    try {
        const date = new Date(dateStr);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid date:', dateStr);
            return '';
        }
        
        // Format the date
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error, 'for value:', dateStr);
        return '';
    }
}

// Add these functions to handle delete and expand
async function handleDelete(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.target.closest('.delete-btn');
    if (!button) return;
    
    const entryId = button.dataset.id;
    if (!entryId) {
        console.error('No entry ID found for delete operation');
        return;
    }

    try {
        console.log('Deleting entry:', entryId);
        await ipcRenderer.invoke('delete-entry', entryId);
        console.log('Entry deleted successfully');
        await loadEntries(); // Refresh the view
    } catch (error) {
        console.error('Error deleting entry:', error);
        showError('Failed to delete entry: ' + error.message);
    }
}

// Update the handleExpand function
function handleExpand(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.target.closest('.expand-btn');
    if (!button) return;
    
    const icon = button.querySelector('i');
    const row = button.closest('tr');
    const entryId = button.dataset.id;
    
    if (!icon || !row || !entryId) {
        console.error('Missing required elements for expand operation');
        return;
    }
    
    // Toggle icon
    if (icon.classList.contains('fa-chevron-down')) {
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
    
    // Get all the data from the row and include all datetime fields
    const entry = {
        id: entryId,
        raw_content: row.cells[0].textContent,
        action: row.cells[1].textContent,
        contact: row.cells[2].textContent,
        project: row.cells[3].textContent,
        final_deadline: row.cells[4].textContent || '',
        priority: row.cells[5].textContent,
        status: row.cells[6].textContent,
        created_at: row.dataset.createdAt || '',
        updated_at: row.dataset.updatedAt || ''
    };
    
    // Toggle details row
    const detailsRow = row.nextElementSibling;
    if (detailsRow && detailsRow.classList.contains('details-row')) {
        detailsRow.classList.toggle('hidden');
    } else {
        const details = document.createElement('tr');
        details.className = 'details-row';
        details.innerHTML = `
            <td colspan="8">
                <div class="details-content">
                    <div class="details-section">
                        <div class="details-header">
                            <h4>Entry Details</h4>
                            <div class="details-timestamps">
                                <span class="timestamp">Created: ${formatDate(entry.created_at)}</span>
                                <span class="timestamp">Updated: ${formatDate(entry.updated_at)}</span>
                            </div>
                            <button class="copy-json-btn" onclick="copyToClipboard('${entryId}')">
                                <i class="fas fa-copy"></i> Copy JSON
                            </button>
                        </div>
                        <div class="details-dates">
                            <span class="date-field">Deadline: ${entry.final_deadline}</span>
                        </div>
                        <pre id="json-${entryId}" class="json-view">${JSON.stringify(entry, null, 2)}</pre>
                    </div>
                </div>
            </td>
        `;
        row.parentNode.insertBefore(details, row.nextSibling);
    }
}

// Add the copyToClipboard function
async function copyToClipboard(entryId) {
    const jsonElement = document.getElementById(`json-${entryId}`);
    if (!jsonElement) {
        console.error('JSON element not found');
        return;
    }

    try {
        await navigator.clipboard.writeText(jsonElement.textContent);
        showSuccess('JSON copied to clipboard');
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        showError('Failed to copy to clipboard');
    }
}

// Add this function to render empty state
function renderEmptyState() {
    console.log('Rendering empty state');
    const tableBody = document.querySelector('#entries-table tbody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    No entries found. Create a new entry to get started.
                </td>
            </tr>
        `;
    }
}

// Add near the top with other DOM element references
const parserDialog = document.getElementById('parser-dialog');
const parserResults = document.getElementById('parser-results');
const parseBtn = document.getElementById('parse-btn');
const copyResultsBtn = document.getElementById('copy-results');
const closeDialogBtn = document.querySelector('.close-btn');

// Add the event listeners
parseBtn.addEventListener('click', async () => {
    const contentInput = document.querySelector('#entry-form textarea[name="content"]');
    const content = contentInput.value;
    
    try {
        // Call the parser through IPC
        const results = await window.electronAPI.parseText(content);
        
        // Display results
        parserResults.textContent = JSON.stringify(results, null, 2);
        parserDialog.classList.remove('hidden');
    } catch (error) {
        console.error('Parser error:', error);
        // Show error notification
        showNotification('Error parsing text', 'error');
    }
});

// Close dialog when clicking close button or outside
closeDialogBtn.addEventListener('click', () => {
    parserDialog.classList.add('hidden');
});

parserDialog.addEventListener('click', (e) => {
    if (e.target === parserDialog) {
        parserDialog.classList.add('hidden');
    }
});

// Copy results to clipboard
copyResultsBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(parserResults.textContent);
        showNotification('Results copied to clipboard', 'success');
    } catch (error) {
        console.error('Copy error:', error);
        showNotification('Error copying to clipboard', 'error');
    }
});
