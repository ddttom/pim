const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs').promises;
const { ipcRenderer } = require('electron');

describe('Renderer', () => {
  let dom;
  let document;
  let window;

  beforeEach(async () => {
    // Setup JSDOM environment
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <link href="https://cdn.quilljs.com/1.3.7/quill.snow.css" rel="stylesheet">
        </head>
        <body>
          <div class="container">
            <div id="editor-container">
              <div id="editor"></div>
              <div class="editor-controls">
                <button id="save-btn">Save</button>
                <input type="file" id="image-upload" accept="image/*" multiple>
                <button id="image-btn">Add Images</button>
              </div>
            </div>
            <div id="entries-list"></div>
          </div>
        </body>
      </html>
    `);

    document = dom.window.document;
    window = dom.window;

    // Mock Quill
    window.Quill = class {
      constructor(element, options) {
        this.root = element;
        this.options = options;
        this.getText = jest.fn().mockReturnValue('Test content');
        this.getSelection = jest.fn().mockReturnValue({ index: 0 });
        this.insertEmbed = jest.fn();
      }
    };

    // Mock IPC
    jest.mock('electron', () => ({
      ipcRenderer: {
        invoke: jest.fn()
      }
    }));
  });

  test('initializes editor with correct options', () => {
    require('../src/renderer/renderer');
    
    const editorOptions = window.Quill.mock.calls[0][1];
    expect(editorOptions.theme).toBe('snow');
    expect(editorOptions.modules.toolbar).toBeDefined();
  });

  test('saves entry with markdown conversion', async () => {
    ipcRenderer.invoke.mockImplementation((channel, ...args) => {
      if (channel === 'parse-text') {
        return { action: 'write' };
      }
      if (channel === 'add-entry') {
        return 'new-id';
      }
    });

    const saveBtn = document.getElementById('save-btn');
    await saveBtn.click();

    expect(ipcRenderer.invoke).toHaveBeenCalledWith('parse-text', 'Test content');
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('add-entry', expect.objectContaining({
      raw_content: 'Test content',
      markdown: expect.any(String)
    }));
  });

  test('handles image uploads', async () => {
    const imageUpload = document.getElementById('image-upload');
    const file = new File(['test image'], 'test.png', { type: 'image/png' });
    
    Object.defineProperty(imageUpload, 'files', {
      value: [file]
    });

    ipcRenderer.invoke.mockImplementation((channel, ...args) => {
      if (channel === 'add-image') {
        return {
          id: 'image-id',
          path: 'media/test.png'
        };
      }
    });

    await imageUpload.dispatchEvent(new Event('change'));

    expect(ipcRenderer.invoke).toHaveBeenCalledWith(
      'add-image',
      expect.any(String),
      expect.any(ArrayBuffer),
      'test.png'
    );
  });
}); 
