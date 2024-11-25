const { ipcRenderer } = require('electron');
const Parser = require('../services/parser');
const DatabaseService = require('../services/database');
const fs = require('fs').promises;
const path = require('path');
let db; // Declare db at module scope

// Initialize parser with a basic logger
const logger = {
  info: console.log,
  error: console.error,
  debug: console.debug,
  warn: console.warn
};

const parser = new Parser(logger);

// Add helper functions first
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(navigator.language, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(date);
}

function areDatesEqual(...dates) {
    const validDates = dates.filter(date => date != null);
    if (validDates.length <= 1) return true;
    
    const firstDate = new Date(validDates[0]).getTime();
    return validDates.every(date => new Date(date).getTime() === firstDate);
}

function getSortIndicator(column) {
    if (currentSort.column !== column) {
        return '<i class="fas fa-sort"></i>';
    }
    return currentSort.direction === 'asc' 
        ? '<i class="fas fa-sort-up"></i>' 
        : '<i class="fas fa-sort-down"></i>';
}

// Add view rendering functions before they're used
function renderTableView(entries) {
    const tbody = document.getElementById('entries-table-body');
    tbody.innerHTML = '';

    // Update table header with sort indicators and click handlers
    const thead = document.querySelector('table thead tr');
    if (thead) {
        thead.innerHTML = `
            <th class="sortable" data-sort="raw_content">
                Content ${getSortIndicator('raw_content')}
            </th>
            <th class="sortable" data-sort="action">
                Action ${getSortIndicator('action')}
            </th>
            <th class="sortable" data-sort="contact">
                Contact ${getSortIndicator('contact')}
            </th>
            <th class="sortable" data-sort="final_deadline">
                Date ${getSortIndicator('final_deadline')}
            </th>
            <th class="sortable" data-sort="priority">
                Priority ${getSortIndicator('priority')}
            </th>
            <th class="sortable" data-sort="project">
                Project ${getSortIndicator('project')}
            </th>
            <th class="sortable" data-sort="location">
                Location ${getSortIndicator('location')}
            </th>
            <th class="sortable" data-sort="complexity">
                Complexity ${getSortIndicator('complexity')}
            </th>
            <th class="sortable" data-sort="duration">
                Duration ${getSortIndicator('duration')}
            </th>
        `;

        // Add click handlers to sortable headers
        thead.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', () => {
                handleSort(th.dataset.sort);
            });
        });
    }

    entries.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="action-cell">
                <button class="delete-btn" data-id="${entry.id}">
                    <i class="fas fa-trash-alt" data-id="${entry.id}"></i>
                </button>
                <button class="expand-btn" data-id="${entry.id}">
                    <i class="fas fa-chevron-down" data-id="${entry.id}"></i>
                </button>
                ${entry.raw_content}
            </td>
            <td>${entry.action || '-'}</td>
            <td>${entry.contact || '-'}</td>
            <td>
                ${areDatesEqual(entry.datetime, entry.due_date, entry.final_deadline) ?
                    `Final Deadline: ${formatDate(entry.final_deadline)}` :
                    `${entry.datetime ? `Scheduled: ${formatDate(entry.datetime)}<br>` : ''}
                     ${entry.due_date ? `Due: ${formatDate(entry.due_date)}<br>` : ''}
                     ${entry.final_deadline ? `Final Deadline: ${formatDate(entry.final_deadline)}` : ''}`
                }
            </td>
            <td class="priority-${entry.priority.toLowerCase()}">${entry.priority}</td>
            <td>${entry.project || '-'}</td>
            <td>${entry.location || '-'}</td>
            <td>${entry.complexity || '-'}</td>
            <td>${entry.duration ? `${entry.duration}min` : '-'}</td>
        `;

        // Update the details row with copy button
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'details-row hidden';
        detailsRow.dataset.parentId = entry.id;
        detailsRow.innerHTML = `
            <td colspan="10">
                <div class="details-content">
                    <div class="details-header">
                        <h4>Full Details</h4>
                        <button class="copy-btn" data-content='${JSON.stringify(entry)}'>
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                    <pre>${JSON.stringify(entry, null, 2)}</pre>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
        tbody.appendChild(detailsRow);
    });

    // Add event listeners for delete and expand buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDelete);
    });

    document.querySelectorAll('.expand-btn').forEach(button => {
        button.addEventListener('click', handleExpand);
    });

    // Add copy button handlers
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', handleCopy);
    });
}

function renderCardsView(entries) {
    const container = document.getElementById('cards-view');
    container.innerHTML = '';

    entries.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header">
                <button class="delete-btn" data-id="${entry.id}">
                    <i class="fas fa-trash-alt" data-id="${entry.id}"></i>
                </button>
                <button class="expand-btn" data-id="${entry.id}">
                    <i class="fas fa-chevron-down" data-id="${entry.id}"></i>
                </button>
                ${entry.priority !== 'None' ? 
                    `<div class="card-priority priority-${entry.priority.toLowerCase()}">${entry.priority}</div>` 
                    : ''}
            </div>
            <div class="card-content">${entry.raw_content}</div>
            <div class="card-meta">
                ${entry.action ? `<div class="card-action">${entry.action}</div>` : ''}
                ${entry.contact ? `<div class="card-contact">${entry.contact}</div>` : ''}
                ${areDatesEqual(entry.datetime, entry.due_date, entry.final_deadline) ?
                    `<div class="card-final-deadline">Final Deadline: ${formatDate(entry.final_deadline)}</div>` :
                    `${entry.datetime ? `<div class="card-date">Scheduled: ${formatDate(entry.datetime)}</div>` : ''}
                     ${entry.due_date ? `<div class="card-due-date">Due: ${formatDate(entry.due_date)}</div>` : ''}
                     ${entry.final_deadline ? `<div class="card-final-deadline">Final Deadline: ${formatDate(entry.final_deadline)}</div>` : ''}`
                }
                ${entry.project ? `<div class="card-project">Project: ${entry.project}</div>` : ''}
                ${entry.location ? `<div class="card-location">Location: ${entry.location}</div>` : ''}
                ${entry.complexity ? `<div class="card-complexity">Complexity: ${entry.complexity}</div>` : ''}
                ${entry.duration ? `<div class="card-duration">Duration: ${entry.duration}min</div>` : ''}
            </div>
            <div class="card-details hidden" data-id="${entry.id}">
                <div class="details-header">
                    <h4>Full Details</h4>
                    <button class="copy-btn" data-content='${JSON.stringify(entry)}'>
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
                <pre>${JSON.stringify(entry, null, 2)}</pre>
            </div>
        `;
        container.appendChild(card);
    });

    // Add event listeners for delete and expand buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDelete);
    });

    document.querySelectorAll('.expand-btn').forEach(button => {
        button.addEventListener('click', handleExpand);
    });

    // Add copy button handlers along with other handlers
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', handleCopy);
    });
}

// Then add loadEntries
async function loadEntries() {
    try {
        console.log('Loading entries...');
        const entries = await ipcRenderer.invoke('get-entries', {
            ...activeFilters,
            sort: currentSort
        });
        console.log('Loaded entries:', entries);
        
        renderTableView(entries);
        renderCardsView(entries);
    } catch (error) {
        console.error('Error loading entries:', error);
    }
}

// State variables should also be outside initializeUI
let activeFilters = {
    priority: new Set(),
    date: new Set(),
    categories: new Set()
};

let currentSort = {
    column: 'final_deadline',
    direction: 'desc'
};

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize UI elements
        initializeUI();
        
        // Add menu event listeners
        ipcRenderer.on('menu-new-entry', () => {
            showNewEntryForm();
        });

        ipcRenderer.on('show-settings', () => {
            showSettingsForm();
        });

        // Initial load
        await loadEntries();
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Add these helper functions
function showNewEntryForm() {
    const entryForm = document.getElementById('entry-form');
    const entryInput = document.getElementById('entry-input');
    if (entryForm && entryInput) {
        hideAllForms();
        entryForm.classList.remove('hidden');
        entryInput.focus();
    }
}

async function showSettingsForm() {
    console.log('Showing settings form...');
    
    const settingsForm = document.getElementById('settings-form');
    const settingsContainer = document.getElementById('settings-container');
    const sidebarSettings = document.getElementById('sidebar-settings');
    
    if (!settingsForm || !settingsContainer) {
        console.error('Settings form elements not found:', {
            form: settingsForm,
            container: settingsContainer
        });
        return;
    }

    try {
        console.log('Loading settings...');
        const settings = await db.getAllSettingsWithDefaults();
        console.log('Loaded settings:', settings);
        
        if (!settings || Object.keys(settings).length === 0) {
            console.error('No settings loaded');
            return;
        }

        // Get the parser config for comparison
        const parserConfig = require('../config/parser.config.js');
        console.log('Parser config:', parserConfig);

        // Generate HTML with the parser config as fallback
        const html = generateSettingsHTML(settings || parserConfig);
        console.log('Generated settings HTML length:', html.length);
        console.log('First 500 chars of HTML:', html.substring(0, 500));
        
        settingsContainer.innerHTML = html;
        hideAllForms();
        settingsForm.classList.remove('hidden');
        if (sidebarSettings) {
            sidebarSettings.classList.add('active');
        }

        // Verify the content was set
        console.log('Settings container content length:', settingsContainer.innerHTML.length);
    } catch (error) {
        console.error('Error showing settings:', error);
        alert('Error showing settings: ' + error.message);
    }
}

// Update initializeUI function
function initializeUI() {
    // Add sidebar button handlers
    const sidebarNewEntry = document.getElementById('sidebar-new-entry');
    const sidebarSettings = document.getElementById('sidebar-settings');

    if (sidebarNewEntry) {
        sidebarNewEntry.addEventListener('click', () => {
            showNewEntryForm();
        });
    }

    if (sidebarSettings) {
        sidebarSettings.addEventListener('click', () => {
            showSettingsForm();
        });
    }

    // Add form button handlers
    const saveEntryBtn = document.getElementById('save-entry');
    const cancelEntryBtn = document.getElementById('cancel-entry');
    const saveSettingsBtn = document.getElementById('save-settings');
    const cancelSettingsBtn = document.getElementById('cancel-settings');
    const closeSettingsBtn = document.getElementById('close-settings');

    if (cancelEntryBtn) {
        cancelEntryBtn.addEventListener('click', () => {
            hideAllForms();
            const entryInput = document.getElementById('entry-input');
            const prioritySelect = document.getElementById('priority-select');
            if (entryInput) entryInput.value = '';
            if (prioritySelect) prioritySelect.value = 'None';
        });
    }

    if (saveEntryBtn) {
        saveEntryBtn.addEventListener('click', async () => {
            const content = entryInput.value.trim();
            if (!content) return;

            try {
                const parsedEntry = parser.parse(content);
                parsedEntry.priority = prioritySelect.value;

                console.log('Saving entry:', parsedEntry);

                // Only set dates if they were actually parsed
                const datetime = parsedEntry.datetime ? parsedEntry.datetime.toISOString() : null;
                const dueDate = content.match(/\b(by|before|due)\b/i) ? datetime : null;
                const final_deadline = datetime || dueDate || null;

                const entryId = await db.addEntry({
                    raw_content: content,
                    rawContent: content,
                    action: parsedEntry.action,
                    contact: parsedEntry.contact,
                    datetime: datetime,
                    priority: parsedEntry.priority,
                    complexity: parsedEntry.complexity,
                    location: parsedEntry.location,
                    duration: parsedEntry.duration,
                    project: parsedEntry.project?.project,
                    recurringPattern: parsedEntry.recurring,
                    dependencies: parsedEntry.dependencies,
                    dueDate: dueDate,
                    final_deadline: final_deadline,
                    categories: parsedEntry.categories || []
                });

                // Add categories if they exist
                if (parsedEntry.categories && parsedEntry.categories.length > 0) {
                    for (const category of parsedEntry.categories) {
                        const categoryId = await db.addCategory(category);
                        await db.linkEntryToCategory(entryId, categoryId);
                    }
                }

                hideAllForms();
                entryInput.value = '';
                prioritySelect.value = 'None';
                
                // Refresh the view
                await loadEntries();
            } catch (error) {
                console.error('Error saving entry:', error);
                alert('Error saving entry: ' + error.message);
            }
        });
    }

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            hideSettingsForm();
        });
    }

    if (cancelSettingsBtn) {
        cancelSettingsBtn.addEventListener('click', hideSettingsForm);
    }

    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', hideSettingsForm);
    }
}

// Move handlers outside of initializeUI to make them globally available
async function handleDelete(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Get the entry ID from either the button or the icon
    const entryId = event.target.dataset.id || event.target.parentElement.dataset.id;
    
    if (!entryId) {
        console.error('No entry ID found for delete operation');
        return;
    }

    try {
        await db.deleteEntry(entryId);
        await loadEntries(); // Refresh the view
    } catch (error) {
        console.error('Error deleting entry:', error);
    }
}

function handleSort(column) {
    // Toggle direction if clicking same column
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'desc';
    }

    loadEntries();
}

function handleExpand(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const entryId = event.target.dataset.id || event.target.parentElement.dataset.id;
    const icon = event.target.tagName === 'I' ? event.target : event.target.querySelector('i');
    
    // Toggle icon
    icon.classList.toggle('fa-chevron-down');
    icon.classList.toggle('fa-chevron-up');
    
    // Find and toggle details based on view type
    const detailsRow = document.querySelector(`.details-row[data-parent-id="${entryId}"]`);
    const cardDetails = document.querySelector(`.card-details[data-id="${entryId}"]`);
    
    if (detailsRow) detailsRow.classList.toggle('hidden');
    if (cardDetails) cardDetails.classList.toggle('hidden');
}

function convertToCSV(entries) {
    if (!entries || entries.length === 0) return '';

    // Get all possible fields from the entries
    const fields = new Set();
    entries.forEach(entry => {
        Object.keys(entry).forEach(key => fields.add(key));
    });
    
    // Convert Set to Array and sort for consistent order
    const headers = Array.from(fields).sort();

    // Create CSV header row
    const headerRow = headers.join(',');

    // Create data rows
    const dataRows = entries.map(entry => {
        return headers.map(field => {
            const value = entry[field];
            
            // Handle different value types
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
            return value;
        }).join(',');
    });

    // Combine header and data rows
    return [headerRow, ...dataRows].join('\n');
}

// Add CSV parsing function
function parseCSV(content) {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
            const values = line.split(',').map(v => {
                // Handle quoted values
                if (v.startsWith('"') && v.endsWith('"')) {
                    try {
                        return JSON.parse(v);
                    } catch {
                        return v.slice(1, -1).replace(/""/g, '"');
                    }
                }
                return v.trim();
            });
            
            // Create object from headers and values
            const entry = {};
            headers.forEach((header, index) => {
                if (values[index] !== undefined && values[index] !== '') {
                    entry[header] = values[index];
                }
            });
            return entry;
        });
}

function generateSettingsHTML(settings) {
    console.log('Generating settings HTML for:', settings);
    
    if (!settings || typeof settings !== 'object') {
        console.error('Invalid settings object:', settings);
        return '<div class="error">No settings available</div>';
    }

    // Process settings for copy functionality
    const processedSettings = processSettingsForCopy(settings);

    // Add copy all button at the top with processed settings
    const html = `
        <div class="settings-header">
            <button class="copy-all-btn" data-settings='${JSON.stringify(processedSettings)}'>
                <i class="fas fa-copy"></i> Copy All Settings
            </button>
        </div>
        ${formatSettingsGroups(settings)}
    `;

    return html;
}

// Add this helper function to process settings for copying
function processSettingsForCopy(settings) {
    if (!settings || typeof settings !== 'object') {
        return settings;
    }

    // Handle RegExp objects
    if (settings instanceof RegExp) {
        return settings.toString();
    }

    // Handle arrays
    if (Array.isArray(settings)) {
        return settings.map(item => processSettingsForCopy(item));
    }

    // Handle objects
    const processed = {};
    for (const [key, value] of Object.entries(settings)) {
        if (value instanceof RegExp) {
            processed[key] = value.toString();
        } else if (typeof value === 'object' && value !== null) {
            processed[key] = processSettingsForCopy(value);
        } else {
            processed[key] = value;
        }
    }

    return processed;
}

function formatSettingsGroups(settings, level = 0) {
    return Object.entries(settings).map(([key, value]) => {
        let content = '';
        
        if (value instanceof RegExp) {
            // Handle RegExp objects directly
            content = `
                <div class="setting-item">
                    <label>${formatKey(key)}</label>
                    <textarea 
                        class="setting-input code-input" 
                        name="${key}"
                        rows="3"
                    >${value.toString()}</textarea>
                </div>
            `;
        } else if (value && typeof value === 'object') {
            if (value.type === 'regex') {
                // Handle RegExp-like objects
                content = `
                    <div class="setting-item">
                        <label>${formatKey(key)}</label>
                        <textarea 
                            class="setting-input code-input" 
                            name="${key}"
                            rows="3"
                        >/${value.pattern}/${value.flags}</textarea>
                    </div>
                `;
            } else if (Array.isArray(value)) {
                // Handle arrays
                const displayValue = value.map(item => {
                    if (item instanceof RegExp) {
                        return item.toString();
                    }
                    if (item && typeof item === 'object') {
                        if (item.type === 'regex') {
                            return `/${item.pattern}/${item.flags}`;
                        }
                        return JSON.stringify(item, null, 2);
                    }
                    return item;
                }).join('\n');
                
                content = `
                    <div class="setting-item">
                        <label>${formatKey(key)}</label>
                        <textarea 
                            class="setting-input" 
                            name="${key}"
                            rows="${Math.max(4, value.length + 1)}"
                        >${displayValue}</textarea>
                    </div>
                `;
            } else {
                // Handle nested objects
                content = `
                    <div class="nested-settings">
                        ${Object.entries(value).map(([nestedKey, nestedValue]) => {
                            if (nestedValue instanceof RegExp) {
                                return `
                                    <div class="setting-item">
                                        <label>${formatKey(nestedKey)}</label>
                                        <textarea 
                                            class="setting-input code-input" 
                                            name="${key}.${nestedKey}"
                                            rows="3"
                                        >${nestedValue.toString()}</textarea>
                                    </div>
                                `;
                            }
                            return `
                                <div class="setting-item">
                                    <label>${formatKey(nestedKey)}</label>
                                    <textarea 
                                        class="setting-input ${typeof nestedValue === 'object' ? 'code-input' : ''}" 
                                        name="${key}.${nestedKey}"
                                        rows="${typeof nestedValue === 'object' ? 3 : 1}"
                                    >${nestedValue instanceof RegExp ? nestedValue.toString() : 
                                       JSON.stringify(nestedValue, null, 2)}</textarea>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }
        } else {
            // Handle primitive values
            content = `
                <div class="setting-item">
                    <label>${formatKey(key)}</label>
                    <textarea 
                        class="setting-input" 
                        name="${key}"
                        rows="1"
                    >${value !== undefined ? value : ''}</textarea>
                </div>
            `;
        }

        return `
            <div class="settings-group">
                <h3>${formatKey(key)}</h3>
                <div class="settings-grid">
                    ${content}
                </div>
            </div>
        `;
    }).join('');
}

// Helper function to format setting keys
function formatKey(key) {
    return key
        .split(/(?=[A-Z])|_/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Update the collectSettingsFromForm function
function collectSettingsFromForm() {
    const settings = {};
    document.querySelectorAll('.setting-input').forEach(input => {
        const key = input.name;
        let value = input.value.trim();

        try {
            // Check if it's a RegExp
            if (value.startsWith('/') && value.includes('/')) {
                const lastSlash = value.lastIndexOf('/');
                const pattern = value.slice(1, lastSlash);
                const flags = value.slice(lastSlash + 1);
                value = {
                    type: 'regex',
                    pattern: pattern,
                    flags: flags
                };
            } else {
                // Try to parse as JSON
                value = JSON.parse(value);
            }
        } catch (e) {
            // If not valid JSON or RegExp, check if it's a list
            if (value.includes('\n')) {
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
            }
            // Otherwise keep as string
        }

        settings[key] = value;
    });
    return settings;
}

// Add this helper method to ensure forms are properly hidden when switching between them
function hideAllForms() {
    const forms = ['entry-form', 'settings-form'];
    forms.forEach(formId => {
        const form = document.getElementById(formId);
        if (form) {
            form.classList.add('hidden');
        }
    });
}

// Update the form show/hide logic
function showForm(formId) {
    hideAllForms();
    const form = document.getElementById(formId);
    if (form) {
        form.classList.remove('hidden');
    }
}

// Add the copy handler function
async function handleCopy(event) {
    const button = event.currentTarget;
    const content = button.dataset.content;

    try {
        await navigator.clipboard.writeText(content);
        
        // Visual feedback
        const icon = button.querySelector('i');
        const originalClass = icon.className;
        icon.className = 'fas fa-check';
        button.classList.add('copied');
        
        // Reset after 2 seconds
        setTimeout(() => {
            icon.className = originalClass;
            button.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    }
}

// Update the settings form show/hide logic
function showSettingsForm() {
    const settingsForm = document.getElementById('settings-form');
    const sidebarSettings = document.getElementById('sidebar-settings');
    if (settingsForm) {
        settingsForm.classList.remove('hidden');
        if (sidebarSettings) {
            sidebarSettings.classList.add('active');
        }
    }
}

function hideSettingsForm() {
    const settingsForm = document.getElementById('settings-form');
    const sidebarSettings = document.getElementById('sidebar-settings');
    if (settingsForm) {
        settingsForm.classList.add('hidden');
        if (sidebarSettings) {
            sidebarSettings.classList.remove('active');
        }
    }
}

// Add to your initialization code
const closeSettingsBtn = document.getElementById('close-settings');
if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => {
        hideSettingsForm();
    });
}

// Add this function near your other DOM-related functions
const populateSettingsForm = async () => {
    const settingsContainer = document.getElementById('settings-container');
    
    try {
        const settings = await ipcRenderer.invoke('get-settings');
        console.log('Retrieved settings:', settings);
        
        if (!settings || Object.keys(settings).length === 0) {
            console.error('No settings received');
            settingsContainer.innerHTML = '<div class="error">No settings available</div>';
            return;
        }

        const settingsHTML = generateSettingsHTML(settings);
        settingsContainer.innerHTML = settingsHTML;
        
        // Add event listener to copy button
        const copyAllBtn = settingsContainer.querySelector('.copy-all-btn');
        if (copyAllBtn) {
            copyAllBtn.addEventListener('click', handleCopyAllSettings);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        settingsContainer.innerHTML = `<div class="error">Error loading settings: ${error.message}</div>`;
    }
};

// Find the event listener for the settings button and modify it
document.getElementById('sidebar-settings').addEventListener('click', () => {
    const settingsForm = document.getElementById('settings-form');
    settingsForm.classList.remove('hidden');
    populateSettingsForm(); // Add this line
});

// Add this function to handle copying all settings
async function handleCopyAllSettings(event) {
    const button = event.currentTarget;
    const settingsStr = button.dataset.settings;
    
    try {
        // Parse the settings to get the object
        const settings = JSON.parse(settingsStr);
        
        // Convert to a nicely formatted string
        const formattedSettings = JSON.stringify(settings, null, 2);
        
        await navigator.clipboard.writeText(formattedSettings);
        
        // Visual feedback
        const icon = button.querySelector('i');
        const originalClass = icon.className;
        icon.className = 'fas fa-check';
        button.classList.add('copied');
        
        // Reset after 2 seconds
        setTimeout(() => {
            icon.className = originalClass;
            button.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy settings:', err);
        alert('Failed to copy settings to clipboard');
    }
}
