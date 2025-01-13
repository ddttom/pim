class Parser {
  constructor() {
    this.plugins = [];
  }

  parse(text) {
    if (!text) {
      return {
        text: '',
        status: 'None',
        priority: null,
        participants: [],
        tags: [],
        dueDate: null
      };
    }

    const entry = {
      text,
      status: 'None',
      priority: null,
      participants: [],
      tags: [],
      dueDate: null
    };

    // Parse status
    const statusMatch = text.match(/\[([^\]]+)\]/);
    if (statusMatch) {
      entry.status = statusMatch[1];
    }

    // Parse priority
    const priorityMatch = text.match(/\(([^)]+)\)/);
    if (priorityMatch) {
      entry.priority = priorityMatch[1];
    }

    // Parse participants
    const participantMatches = text.match(/@(\w+)/g);
    if (participantMatches) {
      entry.participants = participantMatches.map(m => m.slice(1));
    }

    // Parse tags
    const tagMatches = text.match(/#(\w+)/g);
    if (tagMatches) {
      entry.tags = tagMatches.map(m => m.slice(1));
    }

    // Parse due date
    const dateMatch = text.match(/due (\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      entry.dueDate = dateMatch[1];
    }

    return entry;
  }

  resetPlugins() {
    this.plugins = [];
  }
}

export default Parser;
