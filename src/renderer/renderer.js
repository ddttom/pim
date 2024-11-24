const { ipcRenderer } = require('electron');
const parser = require('../services/parser');
const db = require('../services/database');

// UI Elements
const newEntryBtn = document.getElementById('new-entry-btn');
const entryForm = document.getElementById('entry-form');
const entryInput = document.getElementById('entry-input');
const prioritySelect = document.getElementById('priority-select');
const saveEntryBtn = document.getElementById('save-entry');
const cancelEntryBtn = document.getElementById('cancel-entry');
const viewButtons = document.querySelectorAll('.view-btn');
const viewContainers = document.querySelectorAll('.view-container');

// State
let activeFilters = {
    priority: new Set(),
    date: new Set(),
    categories: new Set()
};

// Event Listeners
newEntryBtn.addEventListener('click', () => {
    entryForm.classList.remove('hidden');
});

cancelEntryBtn.addEventListener('click', () => {
    entryForm.classList.add('hidden');
    entryInput.value = '';
    prioritySelect.value = 'None';
});

saveEntryBtn.addEventListener('click', async () => {
    const content = entryInput.value.trim();
    if (!content) return;

    const parsedEntry = parser.parse(content);
    parsedEntry.priority = prioritySelect.value;

    try {
        const entryId = await db.addEntry({
            rawContent: parsedEntry.rawContent,
            action: parsedEntry.action,
            contact: parsedEntry.contact,
            datetime: parsedEntry.datetime?.toISOString(),
            priority: parsedEntry.priority,
            complexity: parsedEntry.complexity,
            location: parsedEntry.location,
            duration: parsedEntry.duration,
            project: parsedEntry.project,
            recurringPattern: parsedEntry.recurringPattern,
            dependencies: parsedEntry.dependencies,
            dueDate: parsedEntry.dueDate?.toISOString(),
        });

        // Add categories
        for (const category of parsedEntry.categories) {
            const categoryId = await db.addCategory(category);
            await db.linkEntryToCategory(entryId, categoryId);
        }

        entryForm.classList.add('hidden');
        entryInput.value = '';
        prioritySelect.value = 'None';
        
        // Refresh the view
        await loadEntries();
    } catch (error) {
        console.error('Error saving entry:', error);
    }
});

viewButtons.forEach(button => {
    button.addEventListener('click', () => {
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

// View rendering functions
function renderTableView(entries) {
    const tbody = document.getElementById('entries-table-body');
    tbody.innerHTML = '';

    entries.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <button class="delete-btn" data-id="${entry.id}">
                    <i class="fas fa-trash-alt" data-id="${entry.id}"></i>
                </button>
                ${entry.raw_content}
            </td>
            <td>${entry.action || '-'}</td>
            <td>${entry.contact || '-'}</td>
            <td>${entry.datetime ? new Date(entry.datetime).toLocaleString() : '-'}</td>
            <td class="priority-${entry.priority.toLowerCase()}">${entry.priority}</td>
            <td>${entry.project || '-'}</td>
            <td>${entry.location || '-'}</td>
            <td>${entry.complexity || '-'}</td>
            <td>${entry.duration ? `${entry.duration}min` : '-'}</td>
            <td>${entry.categories?.join(', ') || '-'}</td>
        `;
        tbody.appendChild(tr);
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDelete);
    });
}

function renderCardsView(entries) {
    const container = document.getElementById('cards-view');
    container.innerHTML = '';

    entries.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <button class="delete-btn" data-id="${entry.id}">
                <i class="fas fa-trash-alt" data-id="${entry.id}"></i>
            </button>
            <div class="card-priority priority-${entry.priority.toLowerCase()}">${entry.priority}</div>
            <div class="card-content">${entry.raw_content}</div>
            <div class="card-meta">
                ${entry.action ? `<div class="card-action">${entry.action}</div>` : ''}
                ${entry.contact ? `<div class="card-contact">${entry.contact}</div>` : ''}
                ${entry.datetime ? `<div class="card-date">${new Date(entry.datetime).toLocaleString()}</div>` : ''}
                ${entry.project ? `<div class="card-project">Project: ${entry.project}</div>` : ''}
                ${entry.location ? `<div class="card-location">Location: ${entry.location}</div>` : ''}
                ${entry.complexity ? `<div class="card-complexity">Complexity: ${entry.complexity}</div>` : ''}
                ${entry.duration ? `<div class="card-duration">Duration: ${entry.duration}min</div>` : ''}
                ${entry.recurring_pattern ? `<div class="card-recurring">Recurring: ${entry.recurring_pattern}</div>` : ''}
                ${entry.due_date ? `<div class="card-due-date">Due: ${new Date(entry.due_date).toLocaleString()}</div>` : ''}
            </div>
            ${entry.categories?.length ? `<div class="card-categories">${entry.categories.join(', ')}</div>` : ''}
            ${entry.dependencies ? `<div class="card-dependencies">Dependencies: ${entry.dependencies}</div>` : ''}
        `;
        container.appendChild(card);
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDelete);
    });
}

function renderTimelineView(entries) {
    const container = document.getElementById('timeline-view');
    container.innerHTML = '';

    const sortedEntries = entries
        .filter(entry => entry.datetime || entry.due_date)
        .sort((a, b) => {
            const dateA = new Date(a.due_date || a.datetime);
            const dateB = new Date(b.due_date || b.datetime);
            return dateB - dateA;
        });

    sortedEntries.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
            <button class="delete-btn" data-id="${entry.id}">
                <i class="fas fa-trash-alt" data-id="${entry.id}"></i>
            </button>
            <div class="timeline-date">
                ${entry.due_date ? `Due: ${new Date(entry.due_date).toLocaleString()}` : ''}
                ${entry.datetime ? `Date: ${new Date(entry.datetime).toLocaleString()}` : ''}
            </div>
            <div class="timeline-content">
                <div class="priority-${entry.priority.toLowerCase()}">${entry.priority}</div>
                <div>${entry.raw_content}</div>
                ${entry.project ? `<div class="timeline-project">Project: ${entry.project}</div>` : ''}
                ${entry.location ? `<div class="timeline-location">Location: ${entry.location}</div>` : ''}
                ${entry.complexity ? `<div class="timeline-complexity">Complexity: ${entry.complexity}</div>` : ''}
                ${entry.duration ? `<div class="timeline-duration">Duration: ${entry.duration}min</div>` : ''}
                ${entry.categories?.length ? `<div class="timeline-categories">${entry.categories.join(', ')}</div>` : ''}
            </div>
        `;
        container.appendChild(item);
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', handleDelete);
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
