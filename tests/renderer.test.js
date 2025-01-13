import { Renderer } from '../src/renderer/renderer.js';

describe('Renderer Tests', () => {
  let rendererInstance;

  beforeEach(() => {
    rendererInstance = new Renderer();
  });

  test('initializes with default state', () => {
    expect(rendererInstance.state).toEqual({
      theme: 'light',
      entries: [],
      currentEntry: null
    });
  });

  test('updates theme correctly', () => {
    rendererInstance.updateTheme('dark');
    expect(rendererInstance.state.theme).toBe('dark');
  });

  test('adds new entry', () => {
    rendererInstance.addEntry('Test entry');
    expect(rendererInstance.state.entries).toHaveLength(1);
    expect(rendererInstance.state.entries[0].text).toBe('Test entry');
  });

  test('selects entry', () => {
    rendererInstance.addEntry('Test entry');
    const entryId = rendererInstance.state.entries[0].id;
    rendererInstance.selectEntry(entryId);
    expect(rendererInstance.state.currentEntry).toBeDefined();
    expect(rendererInstance.state.currentEntry.text).toBe('Test entry');
  });

  test('updates entry', () => {
    rendererInstance.addEntry('Test entry');
    const entryId = rendererInstance.state.entries[0].id;
    rendererInstance.updateEntry(entryId, 'Updated entry');
    expect(rendererInstance.state.entries[0].text).toBe('Updated entry');
  });

  test('deletes entry', () => {
    rendererInstance.addEntry('Test entry');
    const entryId = rendererInstance.state.entries[0].id;
    rendererInstance.deleteEntry(entryId);
    expect(rendererInstance.state.entries).toHaveLength(0);
  });
});
