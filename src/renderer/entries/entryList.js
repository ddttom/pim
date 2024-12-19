import { formatDate, formatPreview } from '../utils/dateFormatter.js';
import { showToast } from '../utils/toast.js';

let currentFilters = {
  search: '',
  status: new Set([]),
  priority: new Set([]),
  sort: 'date-desc',
  overdue: false,
  showProjects: false,
  showTags: false
};

export function filterEntries(entries) {
  return entries.filter(entry => {
    // Search filter
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      const searchableFields = [
        entry.raw || '',
        entry.parsed?.project?.project || '',
        entry.parsed?.priority || '',
        entry.parsed?.tags?.join(' ') || '',
        entry.parsed?.final_deadline ? formatDate(entry.parsed.final_deadline) : '',
        formatDate(entry.created_at)
      ].map(field => field.toLowerCase());
      
      if (!searchableFields.some(field => field.includes(searchTerm))) {
        return false;
      }
    }

    // Priority filter
    if (currentFilters.priority.size > 0 && entry.parsed?.priority) {
      if (!currentFilters.priority.has(entry.parsed.priority)) return false;
    }

    // Overdue filter
    if (currentFilters.overdue) {
      if (!entry.parsed?.final_deadline) return false;
      const deadline = new Date(entry.parsed.final_deadline);
      if (deadline >= new Date()) return false;
    }

    // Projects filter
    if (currentFilters.showProjects) {
      if (!entry.parsed?.project?.project) return false;
    }

    // Tags filter
    if (currentFilters.showTags) {
      if (!entry.parsed?.tags?.length) return false;
    }

    return true;
  });
}

export function sortEntries(entries) {
  return entries.sort((a, b) => {
    const [column, direction] = currentFilters.sort.split('-');
    const multiplier = direction === 'asc' ? 1 : -1;

    switch (column) {
      case 'content':
        return multiplier * ((a.raw || '').localeCompare(b.raw || ''));
      case 'date':
        return multiplier * (new Date(a.created_at) - new Date(b.created_at));
      case 'project':
        const projectA = a.parsed?.project?.project || '';
        const projectB = b.parsed?.project?.project || '';
        return multiplier * projectA.localeCompare(projectB);
      case 'priority':
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        const priorityA = a.parsed?.priority ? priorityOrder[a.parsed.priority] : 2;
        const priorityB = b.parsed?.priority ? priorityOrder[b.parsed.priority] : 2;
        return multiplier * (priorityA - priorityB);
      case 'tags':
        const tagsA = a.parsed?.tags?.join(', ') || '';
        const tagsB = b.parsed?.tags?.join(', ') || '';
        return multiplier * tagsA.localeCompare(tagsB);
      case 'deadline':
        if (!a.parsed?.final_deadline) return multiplier;
        if (!b.parsed?.final_deadline) return -multiplier;
        return multiplier * (new Date(a.parsed.final_deadline) - new Date(b.parsed.final_deadline));
      default:
        return 0;
    }
  });
}

export function renderEntries(entries, onEntryClick) {
  const entriesList = document.getElementById('entries-list');
  if (!entriesList) return;

  try {
    console.log('Rendering entries:', entries);
    const tbody = entriesList.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = entries.map(entry => {
      const content = entry.raw || 'Untitled';
      const truncatedContent = content.length > 13 ? content.slice(0, 13) + '...' : content;
      const project = entry.parsed?.project?.project || '-';
      const deadline = entry.parsed?.final_deadline ? formatDate(entry.parsed.final_deadline) : '-';
      const priority = entry.parsed?.priority || 'normal';
      const tags = entry.parsed?.tags || [];
      const tagsHtml = tags.map(tag => `<span class="tag">${tag}</span>`).join('') || '-';
      
      return `
        <tr data-id="${entry.id}">
          <td class="content-cell" title="${content}">${truncatedContent}</td>
          <td class="date-cell">${formatDate(entry.created_at)}</td>
          <td class="project-cell">${project}</td>
          <td class="priority-cell ${priority}">${priority}</td>
          <td class="tags-cell">${tagsHtml}</td>
          <td class="deadline-cell">${deadline}</td>
        </tr>
      `;
    }).join('');

    // Add click handlers to rows
    tbody.querySelectorAll('tr').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        if (id) onEntryClick(id);
      });
    });

    // Update sort icons
    const [currentColumn, direction] = currentFilters.sort.split('-');
    document.querySelectorAll('.entries-table th.sortable').forEach(header => {
      const column = header.dataset.sort;
      header.classList.remove('sort-asc', 'sort-desc');
      header.querySelector('.sort-icon').textContent = '↕️';
      
      if (column === currentColumn) {
        header.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
        header.querySelector('.sort-icon').textContent = direction === 'asc' ? '↑' : '↓';
      }
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

    console.log('Fetching entries...');
    const entries = await ipcRenderer.invoke('get-entries');
    console.log('Received entries:', entries);

    const filteredEntries = filterEntries(entries);
    console.log('Filtered entries:', filteredEntries);

    const sortedEntries = sortEntries(filteredEntries);
    console.log('Sorted entries:', sortedEntries);
    
    renderEntries(sortedEntries, onEntryClick);
  } catch (error) {
    console.error('Failed to load entries:', error);
    showToast('Failed to load entries', 'error');
  }
}

export function showEntriesList() {
  const editorContainer = document.getElementById('editor-container');
  const entriesContainer = document.getElementById('entries-container');
  const entriesList = document.getElementById('entries-list');
  
  if (editorContainer) {
    editorContainer.classList.add('hidden');
  }
  
  if (entriesContainer) {
    entriesContainer.classList.remove('hidden');
  }
  
  if (entriesList) {
    entriesList.parentElement.classList.remove('hidden');
  }
}

export function setupSearchListener(ipcRenderer, onEntryClick) {
  const searchInput = document.getElementById('search-input');
  const clearButton = document.getElementById('clear-search');
  
  if (searchInput && clearButton) {
    // Input event
    searchInput.addEventListener('input', async (e) => {
      currentFilters.search = e.target.value;
      clearButton.classList.toggle('hidden', !e.target.value);
      await loadEntriesList(ipcRenderer, onEntryClick);
    });

    // Clear button click
    clearButton.addEventListener('click', async () => {
      searchInput.value = '';
      currentFilters.search = '';
      clearButton.classList.add('hidden');
      await loadEntriesList(ipcRenderer, onEntryClick);
      searchInput.focus();
    });

    // Escape key to clear
    searchInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Escape' && searchInput.value) {
        searchInput.value = '';
        currentFilters.search = '';
        clearButton.classList.add('hidden');
        await loadEntriesList(ipcRenderer, onEntryClick);
      }
    });
  }
}

export function setupNavigationListener(ipcRenderer, onEntryClick) {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Update active state
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Apply filter based on data-filter attribute
      const filter = item.dataset.filter;
      currentFilters.status = new Set();
      currentFilters.priority = new Set();
      currentFilters.overdue = false;
      currentFilters.showProjects = false;
      currentFilters.showTags = false;
      
      switch (filter) {
        case 'overdue':
          currentFilters.overdue = true;
          break;
        case 'priority-high':
          currentFilters.priority = new Set(['high']);
          break;
        case 'priority-normal':
          currentFilters.priority = new Set(['normal']);
          break;
        case 'priority-low':
          currentFilters.priority = new Set(['low']);
          break;
        case 'projects':
          currentFilters.showProjects = true;
          break;
        case 'tags':
          currentFilters.showTags = true;
          break;
      }

      await loadEntriesList(ipcRenderer, onEntryClick);
    });
  });
}

export function setupSortListener(ipcRenderer, onEntryClick) {
  const headers = document.querySelectorAll('.entries-table th.sortable');
  headers.forEach(header => {
    header.addEventListener('click', async () => {
      const column = header.dataset.sort;
      const [currentColumn, direction] = currentFilters.sort.split('-');
      
      // Toggle direction if same column, otherwise default to ascending
      const newDirection = (column === currentColumn && direction === 'asc') ? 'desc' : 'asc';
      currentFilters.sort = `${column}-${newDirection}`;

      await loadEntriesList(ipcRenderer, onEntryClick);
    });
  });
}

export function updateFilters(newFilters) {
  currentFilters = { ...currentFilters, ...newFilters };
}
