import { formatDate, formatPreview } from '../utils/dateFormatter.js';
import { showToast } from '../utils/toast.js';

// State management
const state = {
  filters: {
    search: '',
    status: new Set(),
    priority: new Set(),
    type: new Set(),
    sort: 'date-desc',
    overdue: false,
    showProjects: false,
    showTags: false,
    showArchived: false
  },
  eventHandlers: new Map(),
  isUpdating: false
};

const addHandler = (element, event, handler) => {
  if (!element) return;
  
  // Remove existing handler if any
  const existingHandlers = state.eventHandlers.get(element);
  if (existingHandlers?.has(event)) {
    const oldHandler = existingHandlers.get(event);
    element.removeEventListener(event, oldHandler);
    existingHandlers.delete(event);
  }

  // Add new handler
  element.addEventListener(event, handler);
  if (!state.eventHandlers.has(element)) {
    state.eventHandlers.set(element, new Map());
  }
  state.eventHandlers.get(element).set(event, handler);
};

export function filterEntries(entries) {
  console.log('Filtering with:', state.filters);
  return entries.filter(entry => {
    // Filter out archived entries unless explicitly showing them
    if (!state.filters.showArchived && entry.archived) {
      return false;
    }

    // Search filter
    if (state.filters.search) {
      const searchTerm = state.filters.search.toLowerCase();
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
    if (state.filters.priority.size > 0) {
      const entryPriority = entry.parsed?.priority || 'normal';
      if (!state.filters.priority.has(entryPriority)) {
        return false;
      }
    }

    // Type filter
    if (state.filters.type.size > 0) {
      const entryType = entry.type || 'note';
      if (!state.filters.type.has(entryType)) {
        return false;
      }
    }

    // Overdue filter
    if (state.filters.overdue) {
      if (!entry.parsed?.final_deadline) return false;
      const deadline = new Date(entry.parsed.final_deadline);
      const now = new Date();
      if (deadline >= now) return false;
    }

    // Projects filter
    if (state.filters.showProjects) {
      if (!entry.parsed?.project?.project) return false;
    }

    // Tags filter
    if (state.filters.showTags) {
      if (!entry.parsed?.tags?.length) return false;
    }

    return true;
  });
}

export function sortEntries(entries) {
  return entries.sort((a, b) => {
    const [column, direction] = state.filters.sort.split('-');
    const multiplier = direction === 'asc' ? 1 : -1;

    switch (column) {
      case 'type':
        const typeA = a.type || 'note';
        const typeB = b.type || 'note';
        return multiplier * typeA.localeCompare(typeB);
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

export async function renderEntries(entries, onEntryClick) {
  if (state.isUpdating) return;
  state.isUpdating = true;

  try {
    console.log('Rendering entries:', entries);
    const tbody = document.querySelector('#entries-list tbody');
    if (!tbody) return;

    // Clean up existing handlers
    state.eventHandlers.forEach((handlers, element) => {
      handlers.forEach((handler, event) => {
        element.removeEventListener(event, handler);
      });
    });
    state.eventHandlers.clear();

    // Get current date format from settings
    const settings = await window.api.invoke('get-settings');
    const dateFormat = settings?.dateFormat || 'system';

    tbody.innerHTML = entries.map(entry => {
      // Handle dates properly
      const dateStr = entry.updatedAt || entry.created_at || entry.updated_at;
      const formattedDate = dateStr ? formatDate(dateStr, dateFormat) : '-';

      return `
        <tr data-id="${entry.id}" class="${entry.archived ? 'archived' : ''}">
          <td class="content-cell" title="${entry.raw || ''}">${(entry.raw || '').substring(0, 50)}...</td>
          <td class="type-cell ${entry.type || 'note'}">${entry.type || 'note'}</td>
          <td class="date-cell">${formattedDate}</td>
          <td class="project-cell">${entry.parsed?.project?.project || '-'}</td>
          <td class="priority-cell ${entry.parsed?.priority || 'normal'}">${entry.parsed?.priority || 'normal'}</td>
          <td class="tags-cell">${entry.parsed?.tags?.join(', ') || '-'}</td>
          <td class="deadline-cell ${getDeadlineStatus(entry.parsed?.final_deadline)}">${entry.parsed?.final_deadline ? formatDate(entry.parsed.final_deadline, dateFormat) : '-'}</td>
        </tr>
      `;
    }).join('');

    // Add click handlers
    tbody.querySelectorAll('tr').forEach(row => {
      const clickHandler = () => {
        const id = row.getAttribute('data-id');
        if (id && onEntryClick) onEntryClick(id);
      };
      addHandler(row, 'click', clickHandler);
    });
  } finally {
    state.isUpdating = false;
  }
}

export async function loadEntriesList(ipcRenderer, onEntryClick) {
  if (state.isUpdating) return;
  state.isUpdating = true;

  try {
    const entriesList = document.getElementById('entries-list');
    if (!entriesList) {
      console.error('Entries list element not found');
      return;
    }

    console.log('Fetching entries...');
    const entries = await ipcRenderer.invoke('get-entries');
    console.log('Received entries:', entries);
    
    // Debug logging
    if (!entries || entries.length === 0) {
      console.warn('No entries received from database');
    } else {
      console.log('Entry count:', entries.length);
      console.log('First entry sample:', entries[0]);
    }

    // Update table header to include type column and sort indicators
    const headerRow = entriesList.querySelector('thead tr');
    if (headerRow && !headerRow.querySelector('[data-sort="type"]')) {
      // Insert type column after content column
      const typeHeader = document.createElement('th');
      typeHeader.className = 'sortable';
      typeHeader.setAttribute('data-sort', 'type');
      typeHeader.innerHTML = 'Type <span class="sort-icon">↕️</span>';
      
      const contentColumn = headerRow.querySelector('[data-sort="content"]');
      if (contentColumn) {
        contentColumn.after(typeHeader);
      }
    }

    // Update sort icons to match current state
    const [currentColumn, direction] = state.filters.sort.split('-');
    headerRow.querySelectorAll('th.sortable').forEach(header => {
      const icon = header.querySelector('.sort-icon');
      if (icon) {
        if (header.dataset.sort === currentColumn) {
          icon.textContent = direction === 'asc' ? '↑' : '↓';
        } else {
          icon.textContent = '↕️';
        }
      }
    });

    const filteredEntries = filterEntries(entries);
    console.log('Filtered entries:', filteredEntries);

    const sortedEntries = sortEntries(filteredEntries);
    console.log('Sorted entries:', sortedEntries);
    
    await renderEntries(sortedEntries, onEntryClick);
  } catch (error) {
    console.error('Failed to load entries:', error);
    showToast('Failed to load entries', 'error');
  } finally {
    state.isUpdating = false;
  }
}

export function showEntriesList() {
  // Get all relevant containers
  const editorContainer = document.getElementById('editor-container');
  const entriesContainer = document.getElementById('entries-container');
  const sidebar = document.querySelector('.sidebar');
  
  // Hide editor
  if (editorContainer) {
    editorContainer.classList.add('hidden');
  }
  
  // Show entries list and sidebar
  if (entriesContainer) {
    entriesContainer.classList.remove('hidden');
  }
  if (sidebar) {
    sidebar.classList.remove('hidden');
  }
}

export function setupSearchListener(ipcRenderer, onEntryClick) {
  // Clean up any existing handlers first
  state.eventHandlers.forEach((handlers, element) => {
    handlers.forEach((handler, event) => {
      element.removeEventListener(event, handler);
    });
  });
  state.eventHandlers.clear();

  const searchInput = document.getElementById('search-input');
  const clearButton = document.getElementById('clear-search');
  
  if (searchInput && clearButton) {
    // Input event
    const inputHandler = async (e) => {
      if (state.isUpdating) return;
      state.filters.search = e.target.value;
      clearButton.classList.toggle('hidden', !e.target.value);
      await loadEntriesList(ipcRenderer, onEntryClick);
    };
    addHandler(searchInput, 'input', inputHandler);

    // Clear button click
    const clearHandler = async () => {
      if (state.isUpdating) return;
      searchInput.value = '';
      state.filters.search = '';
      clearButton.classList.add('hidden');
      await loadEntriesList(ipcRenderer, onEntryClick);
      searchInput.focus();
    };
    addHandler(clearButton, 'click', clearHandler);

    // Escape key to clear
    const keydownHandler = async (e) => {
      if (state.isUpdating) return;
      if (e.key === 'Escape' && searchInput.value) {
        searchInput.value = '';
        state.filters.search = '';
        clearButton.classList.add('hidden');
        await loadEntriesList(ipcRenderer, onEntryClick);
      }
    };
    addHandler(searchInput, 'keydown', keydownHandler);
  }

  // Return cleanup function
  return () => {
    console.log('[Entries] Cleaning up search listeners');
    state.eventHandlers.forEach((handlers, element) => {
      handlers.forEach((handler, event) => {
        element.removeEventListener(event, handler);
      });
    });
    state.eventHandlers.clear();
  };
}

export function setupNavigationListener(ipcRenderer, onEntryClick) {
  // Clean up any existing handlers first
  state.eventHandlers.forEach((handlers, element) => {
    handlers.forEach((handler, event) => {
      element.removeEventListener(event, handler);
    });
  });
  state.eventHandlers.clear();

  const navItems = document.querySelectorAll('.nav-item');
  
  // Remove any existing click handlers directly
  navItems.forEach(item => {
    const oldHandler = item.onclick;
    if (oldHandler) {
      item.removeEventListener('click', oldHandler);
    }
    item.onclick = null; // Clear any inline handler
  });

  // Set initial state
  const allFilter = document.querySelector('.nav-item[data-filter="all"]');
  if (allFilter) {
    allFilter.classList.add('active');
    setFilterState('all', true);
  } else {
    setFilterState('all', true);
  }
  
  navItems.forEach(item => {
    const clickHandler = async (e) => {
      if (state.isUpdating) return;
      state.isUpdating = true;

      try {
        // Prevent default anchor behavior
        e.preventDefault();
        e.stopPropagation();
        
        const clickedFilter = item.dataset.filter;
        console.log('Clicked filter:', clickedFilter);

        // Handle filter toggle
        if (item.classList.contains('active')) {
          // If clicking active filter, switch to "All"
          navItems.forEach(nav => nav.classList.remove('active'));
          if (allFilter) {
            allFilter.classList.add('active');
            setFilterState('all', true);
          }
        } else {
          // Activate clicked filter
          navItems.forEach(nav => nav.classList.remove('active'));
          item.classList.add('active');
          setFilterState(clickedFilter, true);
        }

        // Reload entries list
        await loadEntriesList(ipcRenderer, onEntryClick);
      } finally {
        state.isUpdating = false;
      }
    };

    // Add click handler
    addHandler(item, 'click', clickHandler);
  });

  // Return cleanup function
  return () => {
    console.log('[Entries] Cleaning up navigation listeners');
    navItems.forEach(item => {
      const handlers = state.eventHandlers.get(item);
      if (handlers) {
        handlers.forEach((handler, event) => {
          item.removeEventListener(event, handler);
        });
      }
      item.onclick = null; // Remove any inline onclick handler
    });
    state.eventHandlers.clear();
  };
}

export function setupSortListener(ipcRenderer, onEntryClick) {
  // Clean up any existing handlers first
  state.eventHandlers.forEach((handlers, element) => {
    handlers.forEach((handler, event) => {
      element.removeEventListener(event, handler);
    });
  });
  state.eventHandlers.clear();

  const headers = document.querySelectorAll('.entries-table th.sortable');
  headers.forEach(header => {
    const clickHandler = async () => {
      if (state.isUpdating) return;
      state.isUpdating = true;

      try {
        const column = header.dataset.sort;
        const [currentColumn, direction] = state.filters.sort.split('-');
        
        // Toggle direction if same column, otherwise default to ascending
        const newDirection = (column === currentColumn && direction === 'asc') ? 'desc' : 'asc';
        
        // Store current filter state
        const currentFilters = { ...state.filters };
        
        // Update sort setting
        state.filters.sort = `${column}-${newDirection}`;
        
        // Update sort icons
        headers.forEach(h => {
          const icon = h.querySelector('.sort-icon');
          if (icon) {
            if (h === header) {
              icon.textContent = newDirection === 'asc' ? '↑' : '↓';
            } else {
              icon.textContent = '↕️';
            }
          }
        });

        await loadEntriesList(ipcRenderer, onEntryClick);
        
        // Restore any lost filter state
        state.filters = {
          ...currentFilters,
          sort: state.filters.sort // Keep new sort setting
        };
      } finally {
        state.isUpdating = false;
      }
    };
    addHandler(header, 'click', clickHandler);
  });

  // Return cleanup function
  return () => {
    console.log('[Entries] Cleaning up sort listeners');
    state.eventHandlers.forEach((handlers, element) => {
      handlers.forEach((handler, event) => {
        element.removeEventListener(event, handler);
      });
    });
    state.eventHandlers.clear();
  };
}

function resetFilters(preserveSearch = true) {
  console.log('Resetting filters');
  const searchTerm = preserveSearch ? state.filters.search : '';
  const sortSetting = state.filters.sort;
  
  state.filters = {
    search: searchTerm,
    sort: sortSetting,
    status: new Set(),
    priority: new Set(),
    type: new Set(),
    overdue: false,
    showProjects: false,
    showTags: false,
    showArchived: false
  };
  console.log('Filters after reset:', state.filters);
}

function setFilterState(filter, preserveSearch = true) {
  console.log('Setting filter state:', filter);
  
  // Reset filters first
  resetFilters(preserveSearch);

  // Apply new filter state if not "all"
  if (filter !== 'all') {
    try {
      if (filter.startsWith('type-')) {
        const type = filter.replace('type-', '');
        console.log('Setting type filter:', type);
        state.filters.type = new Set([type]);
      } else if (filter.startsWith('priority-')) {
        const priority = filter.replace('priority-', '');
        console.log('Setting priority filter:', priority);
        state.filters.priority = new Set([priority]);
      } else {
        switch (filter) {
          case 'overdue':
            console.log('Setting overdue filter');
            state.filters.overdue = true;
            break;
          case 'projects':
            console.log('Setting projects filter');
            state.filters.showProjects = true;
            break;
          case 'tags':
            console.log('Setting tags filter');
            state.filters.showTags = true;
            break;
          case 'archived':
            console.log('Setting archived filter');
            state.filters.showArchived = true;
            break;
          default:
            console.warn('Unknown filter:', filter);
        }
      }
    } catch (error) {
      console.error('Error setting filter state:', error);
      resetFilters(preserveSearch);
    }
  }
  
  console.log('Filter state after change:', state.filters);
}

export function updateFilters(newFilters) {
  state.filters = { ...state.filters, ...newFilters };
}

function getDeadlineStatus(deadline) {
  if (!deadline) return '';
  const deadlineDate = new Date(deadline);
  const now = new Date();
  return deadlineDate > now ? 'future' : 'overdue';
}
