/**
 * @jest-environment jsdom
 */

// Mock all imported modules
jest.mock('../src/renderer/utils/toast.js', () => ({
  showToast: jest.fn()
}));

jest.mock('../src/renderer/editor/editor.js', () => {
  const mockEditor = {
    root: { innerHTML: '' },
    getSelection: jest.fn(() => ({ index: 0 })),
    insertEmbed: jest.fn()
  };

  return {
    initializeEditor: jest.fn(() => mockEditor),
    getEditor: jest.fn(() => mockEditor),
    handleImageUpload: jest.fn(async (event, currentEntryId, ipcRenderer) => {
      const file = event.target.files[0];
      const buffer = await file.arrayBuffer();
      const imageInfo = await ipcRenderer.invoke('add-image', currentEntryId, buffer, file.name);
      mockEditor.insertEmbed(0, 'image', imageInfo.path);
    }),
    showEditor: jest.fn(),
    clearEditor: jest.fn(),
    getEditorContent: jest.fn()
  };
});

jest.mock('../src/renderer/editor/shortcuts.js', () => ({
  setupKeyboardShortcuts: jest.fn()
}));

jest.mock('../src/renderer/entries/entryList.js', () => ({
  loadEntriesList: jest.fn(),
  showEntriesList: jest.fn(),
  toggleFilters: jest.fn(),
  toggleSortMenu: jest.fn()
}));

jest.mock('../src/renderer/entries/entryActions.js', () => ({
  createNewEntry: jest.fn(),
  loadEntry: jest.fn(),
  saveEntry: jest.fn(),
  getCurrentEntryId: jest.fn()
}));

jest.mock('../src/renderer/settings/settings.js', () => ({
  defaultSettings: {
    theme: 'light',
    fontSize: 14
  },
  applySettings: jest.fn(),
  updateSidebarState: jest.fn()
}));

jest.mock('../src/renderer/settings/settingsUI.js', () => ({
  showSettingsModal: jest.fn(),
  closeSettingsModal: jest.fn(),
  setupSettingsUI: jest.fn(),
  saveSettings: jest.fn()
}));

jest.mock('../src/renderer/sync/sync.js', () => ({
  setupAutoSync: jest.fn()
}));

describe('Renderer', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="editor"></div>
      <input type="file" id="image-upload" />
      <div id="settings-modal">
        <button class="close-btn"></button>
        <div class="modal-overlay"></div>
        <div class="modal-footer">
          <button class="primary-btn"></button>
        </div>
      </div>
    `;

    // Mock window.api
    window.api = {
      on: jest.fn(),
      invoke: jest.fn(),
      send: jest.fn()
    };

    // Reset modules
    jest.resetModules();
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
    const rendererModule = await import('../src/renderer/renderer.js');
    
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
    const editorModule = await import('../src/renderer/editor/editor.js');
    
    // Setup DOM with Save As dialog
    document.body.innerHTML += `
      <div class="editor-actions">
        <button id="save-as-btn"></button>
      </div>
    `;

    // Initialize editor
    const editor = editorModule.initializeEditor();
    editor.getText = jest.fn().mockReturnValue('Test content');
    editor.root.innerHTML = '<p>Test content</p>';

    // Setup responses
    window.api.invoke.mockImplementation(async (channel, ...args) => {
      if (channel === 'add-entry') {
        return 'new-entry-id';
      }
      return null;
    });

    // Click Save As button
    const saveAsBtn = document.getElementById('save-as-btn');
    saveAsBtn.click();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get type select and change value
    const typeSelect = document.querySelector('#content-type');
    expect(typeSelect).toBeTruthy();
    
    // Select 'task' type
    typeSelect.value = 'task';
    
    // Click Save button
    const saveBtn = document.querySelector('.modal button.primary-btn');
    await saveBtn.click();
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
    // Import required modules
    const { loadEntriesList } = await import('../src/renderer/entries/entryList.js');
    
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
    await loadEntriesList(window.api);
    let rows = document.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(rows[0].className).not.toContain('archived');

    // Load entries with showing archived
    window.currentFilters = { showArchived: true };
    await loadEntriesList(window.api);
    rows = document.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[1].className).toContain('archived');
  });

  test('handles settings updates', async () => {
    const { applySettings } = await import('../src/renderer/settings/settings.js');
    
    // Clear previous calls
    applySettings.mockClear();
    
    // Setup initial settings
    window.api.invoke.mockResolvedValue({
      theme: 'light',
      fontSize: 14
    });

    // Import renderer
    await import('../src/renderer/renderer.js');
    
    // Wait for initialization
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
    await new Promise(resolve => setTimeout(resolve, 100)); // Longer wait

    // Clear calls from initialization
    applySettings.mockClear();

    // Simulate settings update
    const settings = {
      theme: 'dark',
      fontSize: 16
    };
    
    const callback = window.api.on.mock.calls.find(
      call => call[0] === 'settings-loaded'
    )[1];
    
    callback(settings);
    await new Promise(resolve => setTimeout(resolve, 100)); // Longer wait
    
    expect(applySettings).toHaveBeenCalledWith(settings, expect.any(Object));
  });

  test('handles image uploads', async () => {
    // Import required modules
    const editorModule = await import('../src/renderer/editor/editor.js');
    const { getCurrentEntryId } = await import('../src/renderer/entries/entryActions.js');

    // Reset mocks
    getCurrentEntryId.mockReset();
    getCurrentEntryId.mockReturnValue('test-entry-id');

    // Initialize editor
    const editor = editorModule.initializeEditor();

    // Setup responses
    window.api.invoke.mockImplementation(async (channel, ...args) => {
      if (channel === 'get-settings') {
        return {
          theme: 'light',
          fontSize: 14
        };
      }
      if (channel === 'add-image') {
        return {
          id: 'test-id',
          path: '/path/to/image.png'
        };
      }
      return null;
    });

    // Import renderer and initialize
    await import('../src/renderer/renderer.js');
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
    await new Promise(resolve => setTimeout(resolve, 100));


    // Setup mock File with arrayBuffer
    const mockArrayBuffer = new ArrayBuffer(8);
    const file = {
      name: 'test.png',
      type: 'image/png',
      arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer)
    };

    // Setup image upload
    const imageUpload = document.getElementById('image-upload');
    Object.defineProperty(imageUpload, 'files', {
      value: [file],
      configurable: true
    });

    // Clear previous calls
    window.api.invoke.mockClear();


    // Trigger upload
    const uploadEvent = { target: imageUpload };
    await editorModule.handleImageUpload(uploadEvent, 'test-entry-id', window.api);
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(window.api.invoke).toHaveBeenCalledWith(
      'add-image',
      'test-entry-id',
      expect.any(ArrayBuffer),
      'test.png'
    );

    // Verify editor was updated
    expect(editor.insertEmbed).toHaveBeenCalledWith(
      0,
      'image',
      '/path/to/image.png'
    );
  });
});
