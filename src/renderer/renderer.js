const { ipcRenderer } = require('electron');
const Parser = require('../services/parser');
const DatabaseService = require('../services/database');
const db = new DatabaseService();

// Initialize parser with a basic logger
const logger = {
  info: console.log,
  error: console.error,
  debug: console.debug,
  warn: console.warn
};

const parser = new Parser(logger);

// Add this at the start of your renderer.js file, after the imports
document.addEventListener('DOMContentLoaded', () => {
    // Debug logging to check if elements exist
    console.log('New Entry Button:', document.getElementById('new-entry-btn'));
    console.log('Entry Form:', document.getElementById('entry-form'));
    console.log('View Buttons:', document.querySelectorAll('.view-btn'));
    console.log('View Containers:', document.querySelectorAll('.view-container'));

    // Initialize UI elements
    initializeUI();
});

// Move all UI initialization into a separate function
function initializeUI() {
    // UI Elements
    const newEntryBtn = document.getElementById('new-entry-btn');
    const entryForm = document.getElementById('entry-form');
    const entryInput = document.getElementById('entry-input');
    const prioritySelect = document.getElementById('priority-select');
    const saveEntryBtn = document.getElementById('save-entry');
    const cancelEntryBtn = document.getElementById('cancel-entry');
    const viewButtons = document.querySelectorAll('.view-btn');
    const viewContainers = document.querySelectorAll('.view-container');
    const expandButtons = document.querySelectorAll('.expand-btn');

    if (!newEntryBtn || !entryForm || !entryInput || !prioritySelect || !saveEntryBtn || !cancelEntryBtn) {
        console.error('Required UI elements not found!');
        return;
    }

    // State
    let activeFilters = {
        priority: new Set(),
        date: new Set(),
        categories: new Set()
    };

    // Event Listeners
    newEntryBtn.addEventListener('click', () => {
        console.log('New Entry button clicked');
        entryForm.classList.remove('hidden');
    });

    cancelEntryBtn.addEventListener('click', () => {
        console.log('Cancel button clicked');
        entryForm.classList.add('hidden');
        entryInput.value = '';
        prioritySelect.value = 'None';
    });

    saveEntryBtn.addEventListener('click', async () => {
        const content = entryInput.value.trim();
        if (!content) return;

        try {
            const parsedEntry = parser.parse(content);
            parsedEntry.priority = prioritySelect.value;

            // Extract project name from project object
            const projectName = parsedEntry.project?.project || null;
            
            console.log('Parsed Entry:', parsedEntry); // Debug log
            console.log('Project Name:', projectName); // Debug log

            // Handle datetime and due date separately
            const dateTime = parsedEntry.datetime?.toISOString();
            // Only set dueDate if text contains "by", "before", or "due"
            const dueDate = content.match(/\b(by|before|due)\b/i) ? dateTime : null;

            // Calculate final_deadline as the latest of datetime and dueDate
            const final_deadline = (() => {
                if (!dateTime && !dueDate) return null;
                if (!dateTime) return dueDate;
                if (!dueDate) return dateTime;
                
                const dateTimeObj = new Date(dateTime);
                const dueDateObj = new Date(dueDate);
                return dateTimeObj > dueDateObj ? dateTime : dueDate;
            })();

            const entryId = await db.addEntry({
                raw_content: content,
                rawContent: content,
                action: parsedEntry.action,
                contact: parsedEntry.contact,
                datetime: dateTime,
                priority: parsedEntry.priority,
                complexity: parsedEntry.complexity,
                location: parsedEntry.location,
                duration: parsedEntry.duration,
                project: projectName,
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

            entryForm.classList.add('hidden');
            entryInput.value = '';
            prioritySelect.value = 'None';
            
            // Refresh the view
            await loadEntries();
        } catch (error) {
            console.error('Error saving entry:', error);
            console.error('Parsed Entry:', parsedEntry); // Debug log
            alert('Error saving entry: ' + error.message);
        }
    });

    // View switching
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('View button clicked:', button.dataset.view);
            // Update active button
            viewButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show corresponding view
            const viewName = button.dataset.view;
            viewContainers.forEach(container => {
                container.classList.toggle('active', container.id === `${viewName}-view`);
            });
        });
    });

    // Filter event listeners
    document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const filterType = checkbox.closest('.filter-group').querySelector('h4').textContent.toLowerCase();
            const value = checkbox.value;

            if (checkbox.checked) {
                activeFilters[filterType].add(value);
            } else {
                activeFilters[filterType].delete(value);
            }

            loadEntries().catch(error => console.error('Error loading entries:', error));
        });
    });

    // Add a date formatting helper function at the top
    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat(navigator.language, {
            weekday: 'short', // 'ddd' format (Mon, Tue, etc.)
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    }

    // Add a helper function to check if dates are equal
    function areDatesEqual(...dates) {
        const validDates = dates.filter(date => date != null);
        if (validDates.length <= 1) return true;
        
        const firstDate = new Date(validDates[0]).getTime();
        return validDates.every(date => new Date(date).getTime() === firstDate);
    }

    // View rendering functions
    function renderTableView(entries) {
        const tbody = document.getElementById('entries-table-body');
        tbody.innerHTML = '';

        // First, let's update the table header if it exists
        const thead = document.querySelector('table thead tr');
        if (thead) {
            thead.innerHTML = `
                <th>Content</th>
                <th>Action</th>
                <th>Contact</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Project</th>
                <th>Location</th>
                <th>Complexity</th>
                <th>Duration</th>
            `;
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

            // Add expandable details row
            const detailsRow = document.createElement('tr');
            detailsRow.className = 'details-row hidden';
            detailsRow.dataset.parentId = entry.id;
            detailsRow.innerHTML = `
                <td colspan="10">
                    <div class="details-content">
                        <h4>Full Details</h4>
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
                    <div class="card-priority priority-${entry.priority.toLowerCase()}">${entry.priority}</div>
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
                    <h4>Full Details</h4>
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
    }

    function renderTimelineView(entries) {
        const container = document.getElementById('timeline-view');
        container.innerHTML = '';

        const sortedEntries = entries
            .filter(entry => entry.datetime || entry.due_date || entry.final_deadline)
            .sort((a, b) => {
                const dateA = new Date(a.final_deadline || a.due_date || a.datetime);
                const dateB = new Date(b.final_deadline || b.due_date || b.datetime);
                return dateB - dateA;
            });

        sortedEntries.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-header">
                    <button class="delete-btn" data-id="${entry.id}">
                        <i class="fas fa-trash-alt" data-id="${entry.id}"></i>
                    </button>
                    <button class="expand-btn" data-id="${entry.id}">
                        <i class="fas fa-chevron-down" data-id="${entry.id}"></i>
                    </button>
                </div>
                <div class="timeline-date">
                    ${areDatesEqual(entry.datetime, entry.due_date, entry.final_deadline) ?
                        `Final Deadline: ${formatDate(entry.final_deadline)}` :
                        `${entry.datetime ? `Scheduled: ${formatDate(entry.datetime)}<br>` : ''}
                         ${entry.due_date ? `Due: ${formatDate(entry.due_date)}<br>` : ''}
                         ${entry.final_deadline ? `Final Deadline: ${formatDate(entry.final_deadline)}` : ''}`
                    }
                </div>
                <div class="timeline-content">
                    <div class="priority-${entry.priority.toLowerCase()}">${entry.priority}</div>
                    <div>${entry.raw_content}</div>
                    ${entry.project ? `<div class="timeline-project">Project: ${entry.project}</div>` : ''}
                    ${entry.location ? `<div class="timeline-location">Location: ${entry.location}</div>` : ''}
                    ${entry.complexity ? `<div class="timeline-complexity">Complexity: ${entry.complexity}</div>` : ''}
                    ${entry.duration ? `<div class="timeline-duration">Duration: ${entry.duration}min</div>` : ''}
                </div>
                <div class="timeline-details hidden" data-id="${entry.id}">
                    <h4>Full Details</h4>
                    <pre>${JSON.stringify(entry, null, 2)}</pre>
                </div>
            `;
            container.appendChild(item);
        });

        // Add event listeners for delete and expand buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', handleDelete);
        });

        document.querySelectorAll('.expand-btn').forEach(button => {
            button.addEventListener('click', handleExpand);
        });
    }

    // Centralized delete handler
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

    async function loadEntries() {
        try {
            console.log('Active filters:', activeFilters);
            const entries = await db.getEntries(); // Call without filters for debugging
            
            // Render all views (only the active one will be visible)
            renderTableView(entries);
            renderCardsView(entries);
            renderTimelineView(entries);
        } catch (error) {
            console.error('Error loading entries:', error);
        }
    }

    // Initial load
    loadEntries().catch(error => console.error('Error loading entries on initial load:', error));

    // Add expand/collapse handler
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
        const timelineDetails = document.querySelector(`.timeline-details[data-id="${entryId}"]`);
        
        if (detailsRow) detailsRow.classList.toggle('hidden');
        if (cardDetails) cardDetails.classList.toggle('hidden');
        if (timelineDetails) timelineDetails.classList.toggle('hidden');
    }
}
