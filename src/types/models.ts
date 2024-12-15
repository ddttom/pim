export interface Entry {
  id?: number;
  rawContent: string;
  action?: string;
  contact?: string;
  priority?: 'high' | 'medium' | 'low';
  complexity?: 'simple' | 'medium' | 'complex';
  location?: string;
  duration?: number;
  project?: string;
  recurringPattern?: string;
  finalDeadline?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  createdAt?: string;
  updatedAt?: string;
  categories?: string[];
}

export interface Category {
  id?: number;
  name: string;
}

export interface EntryFilters {
  priority?: Set<string>;
  date?: Set<string>;
  categories?: Set<string>;
  sort?: {
    column: keyof Entry;
    direction: 'asc' | 'desc';
  };
}

export interface Settings {
  parser: {
    maxDepth: number;
    ignoreFiles: string[];
    outputFormat: 'json' | 'text';
    tellTruth: boolean;
  };
  reminders: {
    defaultMinutes: number;
    allowMultiple: boolean;
  };
  ui: {
    theme: 'light' | 'dark';
    fontSize: number;
    showToolbar: boolean;
  };
} 
