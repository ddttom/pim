/**
 * @jest-environment jsdom
 */

import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock all imported modules
jest.mock('../src/renderer/utils/toast.js', () => ({
  showToast: jest.fn()
}));

jest.mock('../src/renderer/editor/editor.js');
jest.mock('../src/renderer/renderer.js');
jest.mock('../src/renderer/settings/settings.js', () => require('./__mocks__/settings.js'));
jest.mock('../src/renderer/settings/settingsUI.js', () => require('./__mocks__/settingsUI.js'));

// Mock entry list module
const mockEntryList = {
  loadEntriesList: jest.fn().mockImplementation(async (api) => {
    const entries = await api.invoke('get-entries');
    const entriesList = document.querySelector('#entries-list tbody');
    if (!entriesList) return;

    // Clear existing content
    entriesList.innerHTML = '';

    // Filter and add entries
    const filteredEntries = entries.filter(entry => 
      window.currentFilters?.showArchived || !entry.archived
    );

    // Add each entry row
    filteredEntries.forEach((entry) => {
      const tr = document.createElement('tr');
      tr.className = entry.archived ? 'archived' : '';
      tr.dataset.id = entry.id;
      tr.innerHTML = `
        <td class="content-cell" title="">${entry.content.raw}</td>
        <td class="type-cell note">note</td>
        <td class="date-cell">-</td>
        <td class="project-cell">-</td>
        <td class="priority-cell normal">normal</td>
        <td class="tags-cell">-</td>
        <td class="deadline-cell">-</td>
      `;
      entriesList.appendChild(tr);
    });
  }),
  showEntriesList: jest.fn(),
  toggleFilters: jest.fn(),
  toggleSortMenu: jest.fn()
};

jest.mock('../src/renderer/entries/entryList.js', () => mockEntryList);

describe('Renderer', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="editor-container">
        <div id="editor"></div>
      </div>
      <input type="file" id="image-upload" />
      <div id="settings-modal">
        <button class="close-btn"></button>
        <div class="modal-overlay"></div>
        <div class="modal-footer">
          <button class="primary-btn"></button>
        </div>
      </div>
      <div id="entries-list">
        <table>
          <tbody></tbody>
        </table>
      </div>
      <div class="editor-actions"></div>
    `;

    // Mock window.api
    window.api = {
      on: jest.fn(),
      invoke: jest.fn(),
      send: jest.fn()
    };

    // Reset modules and mocks
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('initializes editor with correct options', async () => {
    // Setup initial settings response
    window.api.invoke.mockImplementation(async (channel) => {
      if (channel === 'get-settings') {
        return {
          theme: 'light',
          fontSize: 14
        };
      }
      return null;
    });

    // Import renderer
    const { initializeEditor, setupKeyboardShortcuts } = await import('../src/renderer/renderer.js');
    
    // Wait for initialization
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(window.api.on).toHaveBeenCalledWith(
      'settings-loaded',
      expect.any(Function)
    );
  });

  test('handles entry type selection', async () => {
    // Import required modules
    const Editor = (await import('../src/renderer/editor/editor.js')).default;
    const container = document.getElementById('editor-container');
    const editor = new Editor(container);
    
    // Setup responses
    window.api.invoke.mockImplementation(async (channel, ...args) => {
      if (channel === 'add-entry') {
        return 'new-entry-id';
      }
      return null;
    });

    // Create and dispatch save event
    const saveEvent = new CustomEvent('save-entry', {
      detail: {
        type: 'task',
        content: {
          text: 'Test content',
          html: '<p>Test content</p>'
        }
      }
    });

    // Add event listener to handle save event
    document.addEventListener('save-entry', async (event) => {
      const { type, content } = event.detail;
      await window.api.invoke('add-entry', {
        type,
        raw: content.text,
        html: content.html
      });

      const typeBadge = document.createElement('div');
      typeBadge.className = `editor-type-badge ${type}`;
      typeBadge.textContent = type;
      
      document.querySelector('.editor-type-badge')?.remove();
      document.querySelector('.editor-actions').appendChild(typeBadge);
    });

    document.dispatchEvent(saveEvent);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify entry was saved with correct type
    expect(window.api.invoke).toHaveBeenCalledWith('add-entry', expect.objectContaining({
      type: 'task',
      raw: 'Test content',
      html: '<p>Test content</p>'
    }));

    // Verify type badge was updated
    const typeBadge = document.querySelector('.editor-type-badge');
    expect(typeBadge).toBeTruthy();
    expect(typeBadge.textContent).toBe('task');
    expect(typeBadge.className).toContain('task');
  });

  test('handles archived entries', async () => {
    // Setup mock entries
    const mockEntries = [
      { id: '1', content: { raw: 'Active entry' }, archived: false },
      { id: '2', content: { raw: 'Archived entry' }, archived: true }
    ];

    // Setup responses
    window.api.invoke.mockImplementation(async (channel, ...args) => {
      if (channel === 'get-entries') {
        return mockEntries;
      }
      return null;
    });

    // Load entries without showing archived
    window.currentFilters = { showArchived: false };
    await mockEntryList.loadEntriesList(window.api);
    let rows = document.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(rows[0].className).not.toContain('archived');

    // Load entries with showing archived
    window.currentFilters = { showArchived: true };
    await mockEntryList.loadEntriesList(window.api);
    rows = document.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[1].className).toContain('archived');
  });

  test('handles settings updates', async () => {
    // Import required modules
    const settings = await import('../src/renderer/settings/settings.js');
    const { applySettings } = settings;
    
    // Setup initial settings
    window.api.invoke.mockResolvedValue({
      theme: 'light',
      fontSize: 14
    });
    
    // Wait for initialization
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate settings update
    const newSettings = {
      theme: 'dark',
      fontSize: 16
    };
    
    const callback = window.api.on.mock.calls.find(
      call => call[0] === 'settings-loaded'
    )[1];
    
    callback(newSettings);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(applySettings).toHaveBeenCalledWith(newSettings, expect.any(Object));
  });
});
