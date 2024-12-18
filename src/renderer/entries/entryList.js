import { formatDate, formatPreview } from '../utils/dateFormatter.js';
import { showToast } from '../utils/toast.js';

let currentFilters = {
  search: '',
  status: new Set(['pending']),
  priority: new Set(['normal']),
  sort: 'date-desc'
};

export function filterEntries(entries) {
  return entries.filter(entry => {
    // Search filter
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      const content = entry.content.raw.toLowerCase();
      if (!content.includes(searchTerm)) return false;
    }

    // Status filter
    if (currentFilters.status.size > 0) {
      if (!currentFilters.status.has(entry.parsed.status)) return false;
    }

    // Priority filter
    if (currentFilters.priority.size > 0) {
      if (!currentFilters.priority.has(entry.parsed.priority)) return false;
    }

    return true;
  });
}

export function sortEntries(entries) {
  return entries.sort((a, b) => {
    switch (currentFilters.sort) {
      case 'date-desc':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'date-asc':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'priority':
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[b.parsed.priority] - priorityOrder[a.parsed.priority];
      case 'deadline':
        if (!a.parsed.final_deadline) return 1;
        if (!b.parsed.final_deadline) return -1;
        return new Date(a.parsed.final_deadline) - new Date(b.parsed.final_deadline);
      default:
        return 0;
    }
  });
}

export function renderEntries(entries, onEntryClick) {
  const entriesList = document.getElementById('entries-list');
  if (!entriesList) return;

  try {
    entriesList.innerHTML = entries.map(entry => `
      <div class="entry-item" data-id="${entry.id}">
        <div class="entry-header">
          <h3>${entry.title || 'Untitled'}</h3>
          <span class="entry-date">${formatDate(entry.created_at)}</span>
        </div>
        <div class="entry-preview">${entry.preview || ''}</div>
      </div>
    `).join('');

    // Add click handlers to entries
    entriesList.querySelectorAll('.entry-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        if (id) onEntryClick(id);
      });
    });
  } catch (error) {
    console.error('Failed to render entries:', error);
    showToast('Failed to display entries', 'error');
  }
}

export async function loadEntriesList(ipcRenderer, onEntryClick) {
  try {
    const entriesList = document.getElementById('entries-list');
    if (!entriesList) {
      console.error('Entries list element not found');
      return;
    }

    const entries = await ipcRenderer.invoke('get-entries');
    const filteredEntries = filterEntries(entries);
    const sortedEntries = sortEntries(filteredEntries);
    
    renderEntries(sortedEntries, onEntryClick);
  } catch (error) {
    console.error('Failed to load entries:', error);
    showToast('Failed to load entries', 'error');
  }
}

export function showEntriesList() {
  const editorContainer = document.getElementById('editor-container');
  const entriesList = document.getElementById('entries-list');
  
  if (editorContainer) {
    editorContainer.classList.add('hidden');
  }
  
  if (entriesList) {
    entriesList.parentElement.classList.remove('hidden');
  }
}

let filtersVisible = true;

export function toggleFilters() {
  const filters = document.querySelector('.filters');
  filtersVisible = !filtersVisible;
  filters.style.display = filtersVisible ? 'block' : 'none';
  document.getElementById('filter-btn').classList.toggle('active', filtersVisible);
}

export function toggleSortMenu() {
  const sortBtn = document.getElementById('sort-btn');
  const dropdown = document.getElementById('sort-dropdown');
  
  // Close any other open dropdowns first
  document.querySelectorAll('.dropdown-content').forEach(d => {
    if (d !== dropdown) d.style.display = 'none';
  });
  document.querySelectorAll('.ribbon-btn').forEach(b => {
    if (b !== sortBtn) b.classList.remove('active');
  });
  
  // Toggle current dropdown
  const isVisible = dropdown.style.display === 'block';
  dropdown.style.display = isVisible ? 'none' : 'block';
  sortBtn.classList.toggle('active', !isVisible);
}

export function updateFilters(newFilters) {
  currentFilters = { ...currentFilters, ...newFilters };
}
