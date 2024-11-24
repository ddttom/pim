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
            priority: parsedEntry.priority
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

        loadEntries();
    });
});

// View rendering functions
function renderTableView(entries) {
    const tbody = document.getElementById('entries-table-body');
    tbody.innerHTML = '';

    entries.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${entry.raw_content}</td>
            <td>${entry.action || '-'}</td>
            <td>${entry.contact || '-'}</td>
            <td>${entry.datetime ? new Date(entry.datetime).toLocaleString() : '-'}</td>
            <td class="priority-${entry.priority.toLowerCase()}">${entry.priority}</td>
            <td>${entry.categories?.join(', ') || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderCardsView(entries) {
    const container = document.getElementById('cards-view');
    container.innerHTML = '';

    entries.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-priority priority-${entry.priority.toLowerCase()}">${entry.priority}</div>
            <div class="card-content">${entry.raw_content}</div>
            <div class="card-meta">
                ${entry.action ? `<div class="card-action">${entry.action}</div>` : ''}
                ${entry.contact ? `<div class="card-contact">${entry.contact}</div>` : ''}
                ${entry.datetime ? `<div class="card-date">${new Date(entry.datetime).toLocaleString()}</div>` : ''}
            </div>
            ${entry.categories?.length ? `<div class="card-categories">${entry.categories.join(', ')}</div>` : ''}
        `;
        container.appendChild(card);
    });
}

function renderTimelineView(entries) {
    const container = document.getElementById('timeline-view');
    container.innerHTML = '';

    // Sort entries by datetime
    const sortedEntries = entries
        .filter(entry => entry.datetime)
        .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

    sortedEntries.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
            <div class="timeline-date">${new Date(entry.datetime).toLocaleString()}</div>
            <div class="timeline-content">
                <div class="priority-${entry.priority.toLowerCase()}">${entry.priority}</div>
                <div>${entry.raw_content}</div>
                ${entry.categories?.length ? `<div class="timeline-categories">${entry.categories.join(', ')}</div>` : ''}
            </div>
        `;
        container.appendChild(item);
    });
}

async function loadEntries() {
    try {
        const entries = await db.getEntries(activeFilters);
        
        // Render all views (only the active one will be visible)
        renderTableView(entries);
        renderCardsView(entries);
        renderTimelineView(entries);
    } catch (error) {
        console.error('Error loading entries:', error);
    }
}

// Initial load
loadEntries();
