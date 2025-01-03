import { formatDate } from '../utils/dateFormatter.js';

export class CalendarView {
  constructor(container, entries) {
    this.container = container;
    this.entries = entries;
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.viewMode = 'month'; // 'day', 'week', or 'month'
    this.render();
  }

  getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  getMonthData() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const daysInMonth = this.getDaysInMonth(year, month);
    const firstDayOfMonth = this.getFirstDayOfMonth(year, month);
    const weeks = [];
    let currentWeek = new Array(7).fill(null);
    let currentDay = 1;

    // Fill in leading empty days
    for (let i = firstDayOfMonth; i < 7 && currentDay <= daysInMonth; i++) {
      currentWeek[i] = currentDay++;
    }
    weeks.push(currentWeek);

    // Fill in remaining days
    while (currentDay <= daysInMonth) {
      currentWeek = new Array(7).fill(null);
      for (let i = 0; i < 7 && currentDay <= daysInMonth; i++) {
        currentWeek[i] = currentDay++;
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }

  getEntriesForDate(date) {
    const today = new Date();
    return this.entries.filter(entry => {
      // If entry has a deadline, use that date
      if (entry.parsed?.final_deadline) {
        const deadlineDate = new Date(entry.parsed.final_deadline);
        return (
          deadlineDate.getFullYear() === date.getFullYear() &&
          deadlineDate.getMonth() === date.getMonth() &&
          deadlineDate.getDate() === date.getDate()
        );
      }
      
      // If no deadline and date is today, show the entry
      if (!entry.parsed?.final_deadline && 
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate()) {
        return true;
      }

      return false;
    });
  }

  async updateEntryDeadline(entryId, newDate) {
    try {
      const entry = await window.api.invoke('get-entry', entryId);
      if (!entry) return;

      // Update the entry with the new deadline
      const updatedEntry = {
        ...entry,
        parsed: {
          ...entry.parsed,
          final_deadline: newDate.toISOString()
        }
      };

      await window.api.invoke('update-entry', updatedEntry);
      
      // Refresh entries
      const entries = await window.api.invoke('get-entries');
      this.entries = entries;
      this.render();
    } catch (error) {
      console.error('Failed to update entry deadline:', error);
      const { showToast } = await import('../utils/toast.js');
      showToast('Failed to update entry deadline', 'error');
    }
  }

  setupDragAndDrop(element, entry) {
    element.draggable = true;
    
    element.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      e.dataTransfer.setData('text/plain', entry.id);
      e.dataTransfer.effectAllowed = 'move';
      element.classList.add('dragging');
    });

    element.addEventListener('dragend', () => {
      element.classList.remove('dragging');
    });
  }

  setupDropZone(element, date) {
    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.add('drag-over');
    });

    element.addEventListener('dragleave', () => {
      element.classList.remove('drag-over');
    });

    element.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      element.classList.remove('drag-over');
      
      const entryId = e.dataTransfer.getData('text/plain');
      if (entryId) {
        await this.updateEntryDeadline(entryId, date);
      }
    });
  }

  generateYearOptions() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years.map(year => 
      `<option value="${year}" ${year === this.currentDate.getFullYear() ? 'selected' : ''}>${year}</option>`
    ).join('');
  }

  generateMonthOptions() {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames.map((month, index) => 
      `<option value="${index}" ${index === this.currentDate.getMonth() ? 'selected' : ''}>${month}</option>`
    ).join('');
  }

  renderDayView() {
    const entries = this.getEntriesForDate(this.currentDate);
    return `
      <div class="day-view">
        <h3>${formatDate(this.currentDate)}</h3>
        <div class="day-entries">
          ${entries.length > 0 ? entries.map(entry => `
            <div class="entry ${entry.type || 'note'}" data-id="${entry.id}">
              <div class="entry-content">${entry.raw || ''}</div>
              <div class="entry-meta">
                ${entry.type ? `<span class="type">${entry.type}</span>` : ''}
                ${entry.parsed?.priority ? `<span class="priority ${entry.parsed.priority}">${entry.parsed.priority}</span>` : ''}
                ${entry.parsed?.tags?.length ? `<span class="tags">${entry.parsed.tags.join(', ')}</span>` : ''}
              </div>
            </div>
          `).join('') : '<div class="no-entries">No entries for this day</div>'}
        </div>
      </div>
    `;
  }

  renderWeekView() {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekStart = new Date(this.currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return date;
    });

    return `
      <div class="week-view">
        <div class="week-grid">
          ${days.map(date => {
            const entries = this.getEntriesForDate(date);
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = this.selectedDate.toDateString() === date.toDateString();
            
            return `
              <div class="week-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${date.toISOString()}">
                <div class="day-header">
                  <span class="day-name">${dayNames[date.getDay()]}</span>
                  <span class="date-number">${date.getDate()}</span>
                </div>
                <div class="day-entries">
                  ${entries.map(entry => `
                    <div class="entry-preview ${entry.type || 'note'}" title="${entry.raw || ''}" data-id="${entry.id}">
                      ${(entry.raw || '').substring(0, 30)}${(entry.raw || '').length > 30 ? '...' : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  renderMonthView() {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeks = this.getMonthData();

    return `
      <div class="month-view">
        <div class="calendar-days">
          ${dayNames.map(day => `<div class="day-name">${day}</div>`).join('')}
        </div>
        <div class="calendar-dates">
          ${weeks.map(week => `
            <div class="calendar-week">
              ${week.map(day => {
                if (day === null) return '<div class="calendar-day empty"></div>';
                
                const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
                const entries = this.getEntriesForDate(date);
                const isToday = new Date().toDateString() === date.toDateString();
                const isSelected = this.selectedDate.toDateString() === date.toDateString();
                
                return `
                  <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${date.toISOString()}">
                    <span class="date-number">${day}</span>
                    ${entries.length > 0 ? `
                      <div class="entries-indicator">
                        <span class="count">${entries.length}</span>
                        ${entries.map(entry => `
                          <div class="entry-preview ${entry.type || 'note'}" title="${entry.raw || ''}" data-id="${entry.id}">
                            ${(entry.raw || '').substring(0, 30)}${(entry.raw || '').length > 30 ? '...' : ''}
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  render() {
    this.container.innerHTML = `
      <div class="calendar-view">
        <div class="calendar-header">
          <div class="calendar-controls">
            <div class="calendar-navigation">
              <button class="prev-month">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
                </svg>
              </button>
              <div class="date-selectors">
                <select class="month-select">
                  ${this.generateMonthOptions()}
                </select>
                <select class="year-select">
                  ${this.generateYearOptions()}
                </select>
              </div>
              <button class="next-month">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            <div class="view-modes">
              <button class="view-mode-btn ${this.viewMode === 'day' ? 'active' : ''}" data-mode="day">Day</button>
              <button class="view-mode-btn ${this.viewMode === 'week' ? 'active' : ''}" data-mode="week">Week</button>
              <button class="view-mode-btn ${this.viewMode === 'month' ? 'active' : ''}" data-mode="month">Month</button>
            </div>
          </div>
        </div>
        <div class="calendar-content">
          ${this.viewMode === 'day' ? this.renderDayView() :
            this.viewMode === 'week' ? this.renderWeekView() :
            this.renderMonthView()}
        </div>
      </div>
    `;

    // Add event listeners
    this.container.querySelector('.prev-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.render();
    });

    this.container.querySelector('.next-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.render();
    });

    // Month and year select handlers
    this.container.querySelector('.month-select').addEventListener('change', (e) => {
      this.currentDate.setMonth(parseInt(e.target.value));
      this.render();
    });

    this.container.querySelector('.year-select').addEventListener('change', (e) => {
      this.currentDate.setFullYear(parseInt(e.target.value));
      this.render();
    });

    // View mode handlers
    this.container.querySelectorAll('.view-mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.viewMode = e.target.dataset.mode;
        this.render();
      });
    });

    // Entry handlers
    this.container.querySelectorAll('[data-id]').forEach(el => {
      const entry = this.entries.find(e => e.id === el.dataset.id);
      if (!entry) return;

      // Setup drag and drop
      this.setupDragAndDrop(el, entry);

      // Double click to edit
      el.addEventListener('dblclick', (e) => {
        e.stopPropagation(); // Prevent day selection
        const id = el.dataset.id;
        if (id) {
          window.api.send('edit-entry', id);
        }
      });

      // Single click to start drag
      el.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent day selection
        // No additional action needed as draggable is already set
      });
    });

    // Setup drop zones and day selection
    this.container.querySelectorAll('[data-date]').forEach(el => {
      const date = new Date(el.dataset.date);
      
      // Setup drop zone
      this.setupDropZone(el, date);
      
      // Day selection handler
      el.addEventListener('click', (e) => {
        // Only handle click if not dragging
        if (!this.container.querySelector('.dragging')) {
          this.selectedDate = date;
          this.currentDate = new Date(date);
          this.render();
        }
      });

      // Context menu handler
      el.addEventListener('contextmenu', async (e) => {
        e.preventDefault();
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
          <div class="menu-item" data-action="paste">Paste</div>
          <div class="menu-item" data-action="new">Add New Entry</div>
        `;
        
        // Position menu at click location
        menu.style.position = 'fixed';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        document.body.appendChild(menu);

        // Handle menu item clicks
        menu.addEventListener('click', async (menuEvent) => {
          const action = menuEvent.target.dataset.action;
          if (action === 'paste') {
            try {
              const clipText = await window.api.invoke('read-clipboard');
              // Try to parse as JSON
              const entry = JSON.parse(clipText);
              if (entry.raw || entry.html) {
                // Valid entry JSON, create new entry
                const newEntry = {
                  ...entry,
                  parsed: {
                    ...entry.parsed,
                    final_deadline: date.toISOString()
                  }
                };
                await window.api.invoke('add-entry', newEntry);
                
                // Refresh entries
                const entries = await window.api.invoke('get-entries');
                this.entries = entries;
                this.render();
              } else {
                // Not valid JSON or invalid entry format, open editor with clipboard content
                const { EditorModal } = await import('../editor/EditorModal.js');
                const modal = new EditorModal();
                await modal.show({
                  title: 'New Entry',
                  content: clipText
                });
                modal.editor.entryId = null; // Ensure it's a new entry
              }
            } catch (error) {
              console.error('Failed to handle paste:', error);
              const { showToast } = await import('../utils/toast.js');
              showToast('Failed to paste content', 'error');
            }
          } else if (action === 'new') {
            const { EditorModal } = await import('../editor/EditorModal.js');
            const modal = new EditorModal();
            await modal.show({
              title: 'New Entry'
            });
            modal.editor.entryId = null;
          }
          
          // Remove menu
          document.body.removeChild(menu);
        });

        // Remove menu when clicking outside
        const removeMenu = (e) => {
          if (!menu.contains(e.target)) {
            document.body.removeChild(menu);
            document.removeEventListener('click', removeMenu);
          }
        };
        document.addEventListener('click', removeMenu);
      });
    });
  }
}
