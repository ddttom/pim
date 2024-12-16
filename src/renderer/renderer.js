const { ipcRenderer } = require('electron');

console.log('=== Starting renderer.js ===');

// Keep all function declarations at the top
function showSettingsForm() {
    const settingsForm = document.getElementById('settings-form');
    if (!settingsForm) {
        showError('Settings form not found');
        return;
    }
    
    try {
        hideAllForms();
        settingsForm.classList.remove('hidden');
        populateSettingsForm();
    } catch (error) {
        showError(`Error showing settings: ${error.message}`);
        console.error('Error in showSettingsForm:', error);
    }
}

function hideSettingsForm() {
    const settingsForm = document.getElementById('settings-form');
    if (!settingsForm) {
        showError('Settings form not found');
        return;
    }
    
    try {
        settingsForm.classList.add('hidden');
    } catch (error) {
        showError(`Error hiding settings: ${error.message}`);
        console.error('Error in hideSettingsForm:', error);
    }
}

function hideAllForms() {
    try {
        const forms = document.querySelectorAll('.modal');
        forms.forEach(form => form.classList.add('hidden'));
    } catch (error) {
        showError(`Error hiding forms: ${error.message}`);
        console.error('Error in hideAllForms:', error);
    }
}

async function populateSettingsForm() {
    console.log('=== Populating Settings Form ===');
    const settingsForm = document.getElementById('settings-form');
    const settingsContainer = document.getElementById('settings-container');
    
    console.log('Settings form element:', settingsForm);
    console.log('Settings container element:', settingsContainer);
    
    if (!settingsForm || !settingsContainer) {
        console.error('Required elements not found:', {
            settingsForm: !!settingsForm,
            settingsContainer: !!settingsContainer
        });
        return;
    }
    
    try {
        console.log('Fetching settings from main process...');
        const settings = await ipcRenderer.invoke('get-settings');
        console.log('Retrieved settings:', settings);
        
        if (!settings || Object.keys(settings).length === 0) {
            console.warn('No settings received');
            settingsContainer.innerHTML = '<div class="error">No settings available</div>';
            return;
        }

        // Generate HTML
        console.log('Generating settings HTML...');
        const html = generateSettingsHTML(settings);
        console.log('Generated HTML length:', html.length);
        
        // Set HTML
        settingsContainer.innerHTML = html;
        console.log('Settings HTML set to container');
        
        // Add event listeners
        console.log('Adding event listeners...');
        setupSettingsEventListeners();
        
    } catch (error) {
        console.error('Error loading settings:', error);
        settingsContainer.innerHTML = `<div class="error">Error loading settings: ${error.message}</div>`;
    }
}

// Move all initialization code into DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM Content Loaded ===');
    
    // Debug all important elements
    const elements = {
        settingsBtn: document.getElementById('settings-btn'),
        settingsForm: document.getElementById('settings-form'),
        settingsContainer: document.getElementById('settings-container'),
        settingsClose: document.getElementById('settings-close'),
        settingsCancel: document.getElementById('settings-cancel'),
        settingsSave: document.getElementById('settings-save')
    };
    
    console.log('Important elements:', {
        settingsBtn: !!elements.settingsBtn,
        settingsForm: !!elements.settingsForm,
        settingsContainer: !!elements.settingsContainer,
        settingsClose: !!elements.settingsClose,
        settingsCancel: !!elements.settingsCancel,
        settingsSave: !!elements.settingsSave
    });
    
    // Set up settings button
    if (elements.settingsBtn) {
        console.log('Adding settings button click listener');
        elements.settingsBtn.addEventListener('click', () => {
            console.log('Settings button clicked');
            showSettingsForm();
        });
    } else {
        console.error('Settings button not found');
    }
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
    console.log('Generating HTML for settings:', settings);

    if (!settings || typeof settings !== 'object') {
        console.error('Invalid settings object:', settings);
        return '<div class="error">No settings available</div>';
    }

    const sections = [
        {
            title: 'Time Settings',
            fields: [
                {
                    key: 'TIME_OF_DAY.morning',
                    label: 'Morning Hours',
                    type: 'timerange',
                    value: settings.TIME_OF_DAY?.morning || { start: 9, end: 12 },
                    description: 'Morning period (24h format)'
                },
                {
                    key: 'TIME_OF_DAY.afternoon',
                    label: 'Afternoon Hours',
                    type: 'timerange',
                    value: settings.TIME_OF_DAY?.afternoon || { start: 12, end: 17 },
                    description: 'Afternoon period (24h format)'
                },
                {
                    key: 'TIME_OF_DAY.evening',
                    label: 'Evening Hours',
                    type: 'timerange',
                    value: settings.TIME_OF_DAY?.evening || { start: 17, end: 21 },
                    description: 'Evening period (24h format)'
                }
            ]
        },
        {
            title: 'Default Times',
            fields: [
                {
                    key: 'defaultTimes.meeting',
                    label: 'Default Meeting Time',
                    type: 'number',
                    value: settings.defaultTimes?.meeting || 9,
                    description: 'Default hour for meetings'
                },
                {
                    key: 'defaultTimes.call',
                    label: 'Default Call Time',
                    type: 'number',
                    value: settings.defaultTimes?.call || 10,
                    description: 'Default hour for calls'
                },
                {
                    key: 'defaultTimes.review',
                    label: 'Default Review Time',
                    type: 'number',
                    value: settings.defaultTimes?.review || 14,
                    description: 'Default hour for reviews'
                }
            ]
        },
        {
            title: 'Default Reminders',
            fields: [
                {
                    key: 'defaultReminders.meeting',
                    label: 'Meeting Reminder',
                    type: 'number',
                    value: settings.defaultReminders?.meeting || 15,
                    description: 'Minutes before meeting'
                },
                {
                    key: 'defaultReminders.call',
                    label: 'Call Reminder',
                    type: 'number',
                    value: settings.defaultReminders?.call || 5,
                    description: 'Minutes before call'
                },
                {
                    key: 'defaultReminders.review',
                    label: 'Review Reminder',
                    type: 'number',
                    value: settings.defaultReminders?.review || 30,
                    description: 'Minutes before review'
                }
            ]
        },
        {
            title: 'Status Settings',
            fields: [
                {
                    key: 'status.default',
                    label: 'Default Status',
                    type: 'select',
                    value: settings.status?.default || 'None',
                    options: settings.status?.values || ['None', 'Blocked', 'Complete', 'Started', 'Closed', 'Abandoned'],
                    description: 'Default status for new items'
                }
            ]
        }
    ];

    return `
        <div class="settings-grid">
            ${sections.map(section => `
                <div class="settings-section">
                    <h3>${section.title}</h3>
                    ${section.fields.map(field => {
                        if (field.type === 'timerange') {
                            return `
                                <div class="setting-item">
                                    <label>${field.label}</label>
                                    <div class="time-range">
                                        <div class="time-input">
                                            <label>Start</label>
                                            <input type="number"
                                                   name="${field.key}.start"
                                                   class="setting-input"
                                                   value="${field.value.start}"
                                                   min="0"
                                                   max="23"
                                            />
                                        </div>
                                        <div class="time-input">
                                            <label>End</label>
                                            <input type="number"
                                                   name="${field.key}.end"
                                                   class="setting-input"
                                                   value="${field.value.end}"
                                                   min="0"
                                                   max="23"
                                            />
                                        </div>
                                    </div>
                                    <div class="setting-description">${field.description}</div>
                                </div>
                            `;
                        } else if (field.type === 'select') {
                            return `
                                <div class="setting-item">
                                    <label for="${field.key}">${field.label}</label>
                                    <select id="${field.key}"
                                            name="${field.key}"
                                            class="setting-input">
                                        ${field.options.map(option => `
                                            <option value="${option}" ${option === field.value ? 'selected' : ''}>
                                                ${option}
                                            </option>
                                        `).join('')}
                                    </select>
                                    <div class="setting-description">${field.description}</div>
                                </div>
                            `;
                        }
                        return `
                            <div class="setting-item">
                                <label for="${field.key}">${field.label}</label>
                                <input type="${field.type}"
                                       id="${field.key}"
                                       name="${field.key}"
                                       class="setting-input"
                                       value="${escapeHtml(field.value)}"
                                       ${field.type === 'number' ? 'min="0"' : ''}
                                />
                                <div class="setting-description">${field.description}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

// Helper function to format labels
function formatLabel(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

// Helper function to escape HTML
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

// Update the collectSettingsFromForm function to match the actual config structure
function collectSettingsFromForm() {
    const settings = {
        TIME_OF_DAY: {
            morning: { start: 9, end: 12 },
            afternoon: { start: 12, end: 17 },
            evening: { start: 17, end: 21 }
        },
        DEFAULT_MEETING_REMINDER: 15,
        status: {
            default: 'None',
            values: ['None', 'Blocked', 'Complete', 'Started', 'Closed', 'Abandoned']
        }
    };

    document.querySelectorAll('.setting-input').forEach(input => {
        const path = input.name.split('.');
        let current = settings;
        
        // Handle special case for non-nested settings
        if (path.length === 1) {
            let value = input.value;
            if (input.type === 'number') {
                value = Number(value);
            }
            settings[path[0]] = value;
            return;
        }

        // Navigate through the object path
        for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) {
                current[path[i]] = {};
            }
            current = current[path[i]];
        }

        // Set the value with appropriate type conversion
        let value = input.value;
        if (input.type === 'number') {
            value = Number(value);
        }

        current[path[path.length - 1]] = value;
    });

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
    console.error(message);
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
        console.log('Saving entry with content:', content);
        let result;
        
        if (editData) {
            result = await ipcRenderer.invoke('reparse-entry', {
                id: editData.id,
                content: content,
                created_at: editData.created_at
            });
        } else {
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
            const content = input?.value || '';
            try {
                const results = await ipcRenderer.invoke('parse-text', content);
                const parserResults = document.getElementById('parser-results');
                const parserDialog = document.getElementById('parser-dialog');
                
                if (parserResults && parserDialog) {
                    parserResults.textContent = JSON.stringify(results, null, 2);
                    parserDialog.classList.remove('hidden');
                }
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

    // Initialize parser dialog after form elements are created
    initializeParserDialog();
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
    
    // Find existing details row
    const nextRow = row.nextElementSibling;
    const isDetailsRow = nextRow?.classList.contains('details-row');
    
    // If details row exists, toggle visibility
    if (isDetailsRow && nextRow) {
        const isHidden = nextRow.classList.contains('hidden');
        
        // Toggle visibility
        if (isHidden) {
            nextRow.classList.remove('hidden');
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            nextRow.classList.add('hidden');
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
        return;
    }
    
    // If no details row exists, create one
    icon.classList.remove('fa-chevron-down');
    icon.classList.add('fa-chevron-up');
    
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
    
    // Create new details row
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

// Function to initialize parser dialog
function initializeParserDialog() {
    const parserDialog = document.getElementById('parser-dialog');
    const parserResults = document.getElementById('parser-results');
    const parseBtn = document.getElementById('parse-btn');
    const copyResultsBtn = document.getElementById('copy-results');
    const closeDialogBtn = parserDialog?.querySelector('.close-btn');

    if (!parserDialog || !parserResults || !copyResultsBtn || !closeDialogBtn) {
        console.warn('Parser dialog elements not found - they may be created dynamically');
        return;
    }

    // Add the event listeners
    if (parseBtn) {
        parseBtn.addEventListener('click', async () => {
            const contentInput = document.querySelector('#entry-form textarea[name="content"]');
            if (!contentInput) {
                console.error('Content input not found');
                return;
            }

            const content = contentInput.value;
            
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
            showSuccess('Results copied to clipboard');
        } catch (error) {
            console.error('Copy error:', error);
            showError('Error copying to clipboard');
        }
    });
}

// Add this new function to set up event listeners
function setupSettingsEventListeners() {
    console.log('=== Setting up Settings Event Listeners ===');
    
    // Close button
    const closeBtn = document.getElementById('settings-close');
    if (closeBtn) {
        console.log('Adding close button listener');
        closeBtn.addEventListener('click', () => {
            console.log('Close button clicked');
            hideSettingsForm();
        });
    } else {
        console.error('Close button not found');
    }

    // Cancel button
    const cancelBtn = document.getElementById('settings-cancel');
    if (cancelBtn) {
        console.log('Adding cancel button listener');
        cancelBtn.addEventListener('click', () => {
            console.log('Cancel button clicked');
            hideSettingsForm();
        });
    } else {
        console.error('Cancel button not found');
    }

    // Save button
    const saveBtn = document.getElementById('settings-save');
    if (saveBtn) {
        console.log('Adding save button listener');
        saveBtn.addEventListener('click', async () => {
            console.log('Save button clicked');
            try {
                const newSettings = collectSettingsFromForm();
                console.log('Collected settings:', newSettings);
                await ipcRenderer.invoke('save-settings', newSettings);
                hideSettingsForm();
                showSuccess('Settings saved successfully');
            } catch (error) {
                console.error('Error saving settings:', error);
                showError('Failed to save settings: ' + error.message);
            }
        });
    } else {
        console.error('Save button not found');
    }
}

// Add helper function to get setting descriptions
function getSettingDescription(category, key) {
    const descriptions = {
        parser: {
            maxDepth: 'Maximum depth for recursive operations',
            ignoreFiles: 'Files and folders to ignore during parsing',
            outputFormat: 'Output format for parser results',
            tellTruth: 'Enable or disable certain validations'
        },
        reminders: {
            defaultMinutes: 'Default reminder time in minutes',
            allowMultiple: 'Allow multiple reminders per item'
        }
    };

    return descriptions[category]?.[key] || '';
}

// Add this code where the input/textarea is initialized
const contentInput = document.getElementById('contentInput'); // or whatever your input element ID is
const parseButton = document.getElementById('parseButton');

// Hide parse button initially
parseButton.classList.add('parse-button');

// Show parse button only when there's content
contentInput.addEventListener('input', (event) => {
  const hasContent = event.target.value.trim().length > 0;
  document.body.classList.toggle('has-content', hasContent);
});
