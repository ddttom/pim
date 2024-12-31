import { Modal } from '../utils/modal.js';
import { formatDate } from '../utils/dateFormatter.js';

export class EntryPreviewModal extends Modal {
  constructor() {
    super({
      title: 'Entry Preview',
      content: '',
      width: '600px',
      headerButtons: [
        {
          id: 'edit-entry-btn',
          className: 'secondary-btn',
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
          </svg>`,
          tooltip: 'Edit Entry',
          onClick: async () => {
            this.close();
            const { EditorModal } = await import('../editor/EditorModal.js');
            const modal = new EditorModal();
            await modal.loadEntry(this.currentEntry.id);
          }
        },
        {
          id: 'copy-entry-btn',
          className: 'secondary-btn',
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
          </svg>`,
          tooltip: 'Copy to Clipboard',
          onClick: async () => {
            await window.api.invoke('copy-to-clipboard', this.currentEntry.raw);
            const { showToast } = await import('../utils/toast.js');
            showToast('Entry copied to clipboard');
          }
        },
        {
          id: 'delete-entry-btn',
          className: 'secondary-btn',
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
          </svg>`,
          tooltip: 'Delete Entry',
          onClick: async () => {
            if (confirm('Are you sure you want to delete this entry?')) {
              await window.api.invoke('delete-entry', this.currentEntry.id);
              const { showToast } = await import('../utils/toast.js');
              showToast('Entry deleted');
              this.close();
            }
          }
        }
      ],
      buttons: [
        {
          text: 'Close',
          onClick: () => this.close()
        }
      ]
    });
    this.currentEntry = null;
  }

  showEntry(entry) {
    this.currentEntry = entry;
    const content = document.createElement('div');
    content.className = 'entry-preview-content';
    
    content.innerHTML = `
      <div class="entry-header">
        <div class="entry-type ${entry.type || 'note'}">${entry.type || 'note'}</div>
        <div class="entry-date">Created: ${formatDate(entry.created_at)}</div>
        ${entry.updated_at ? `<div class="entry-date">Updated: ${formatDate(entry.updated_at)}</div>` : ''}
      </div>
      <div class="entry-body">
        ${entry.raw || ''}
      </div>
      <div class="entry-meta">
        <div class="meta-section">
          <div class="meta-item">
            <span class="label">Type:</span>
            <span class="value">${entry.type || 'note'}</span>
          </div>
          <div class="meta-item">
            <span class="label">Project:</span>
            <span class="value">${entry.parsed?.project?.project || '-'}</span>
          </div>
          <div class="meta-item">
            <span class="label">Priority:</span>
            <span class="value priority-${entry.parsed?.priority || 'normal'}">${entry.parsed?.priority || 'normal'}</span>
          </div>
        </div>
        <div class="meta-section">
          <div class="meta-item">
            <span class="label">Tags:</span>
            <span class="value">${entry.parsed?.tags?.join(', ') || '-'}</span>
          </div>
          <div class="meta-item">
            <span class="label">Deadline:</span>
            <span class="value">${entry.parsed?.final_deadline ? formatDate(entry.parsed.final_deadline) : '-'}</span>
          </div>
          ${entry.parsed?.status ? `
            <div class="meta-item">
              <span class="label">Status:</span>
              <span class="value">${entry.parsed.status}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    this.setContent(content);
    this.show();
  }
}

// Add styles
const style = document.createElement('style');
style.textContent = `
  .entry-preview-content {
    padding: 16px;
  }

  .entry-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .entry-type {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9em;
    font-weight: 500;
    text-transform: capitalize;
  }

  .entry-type.note { 
    color: #4CAF50;
    background: rgba(76, 175, 80, 0.1);
  }
  .entry-type.task { 
    color: #F44336;
    background: rgba(244, 67, 54, 0.1);
  }
  .entry-type.event { 
    color: #2ecc71;
    background: rgba(0, 150, 136, 0.1);
  }
  .entry-type.document { 
    color: #f1c40f;
    background: rgba(255, 152, 0, 0.1);
  }

  .entry-date {
    color: var(--secondary-color);
    font-size: 0.9em;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .entry-body {
    margin-bottom: 16px;
    line-height: 1.6;
    white-space: pre-wrap;
    padding: 16px;
    background: var(--background-color);
    border-radius: 4px;
    border: 1px solid var(--border-color);
  }

  .entry-meta {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
  }

  .meta-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: var(--background-color);
    border-radius: 4px;
    border: 1px solid var(--border-color);
  }

  .meta-item {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .meta-item .label {
    color: var(--secondary-color);
    font-size: 0.9em;
    min-width: 80px;
  }

  .meta-item .value {
    color: var(--text-color);
    font-weight: 500;
  }

  .meta-item .value.priority-high {
    color: #e74c3c;
  }

  .meta-item .value.priority-normal {
    color: #f39c12;
  }

  .meta-item .value.priority-low {
    color: #27ae60;
  }
`;
document.head.appendChild(style);
