export class Renderer {
  constructor() {
    this.state = {
      theme: 'light',
      entries: [],
      currentEntry: null
    };
  }

  updateTheme(theme) {
    this.state.theme = theme;
  }

  addEntry(text) {
    const entry = {
      id: Date.now(),
      text,
      createdAt: new Date()
    };
    this.state.entries.push(entry);
  }

  selectEntry(id) {
    this.state.currentEntry = this.state.entries.find(e => e.id === id);
  }

  updateEntry(id, text) {
    const entry = this.state.entries.find(e => e.id === id);
    if (entry) {
      entry.text = text;
    }
  }

  deleteEntry(id) {
    this.state.entries = this.state.entries.filter(e => e.id !== id);
  }
}

export const renderer = new Renderer();
