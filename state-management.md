# State Management Guide for AI Assistants

This guide covers state management patterns, best practices, and implementation strategies for applications. Use it to help developers architect robust state management solutions.

## Core Concepts

### 1. What is State?

- State is any data that can change over time in an application
- Types of state:
  - UI State (current page, modal visibility, form inputs)
  - Application State (user data, settings, cached responses)
  - Server State (data from backend, sync status)
  - URL State (route parameters, query strings)

### 2. State Management Challenges

- Data consistency across components
- Race conditions in async operations
- State synchronization between processes
- Performance with frequent updates
- Predictable state mutations
- Debug and development experience

## Implementation Patterns

### 1. Centralized Store Pattern

```javascript
class Store {
    constructor() {
        this.state = {
            data: {},
            ui: {},
            settings: {}
        };
        this.listeners = new Set();
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        const prevState = {...this.state};
        this.state = {...this.state, ...newState};
        this.notify(prevState);
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify(prevState) {
        for (const listener of this.listeners) {
            listener(this.state, prevState);
        }
    }
}
```

### 2. Action Creator Pattern

```javascript
const createAction = (type) => (payload) => ({
    type,
    payload
});

const actions = {
    updateSettings: createAction('UPDATE_SETTINGS'),
    updateUser: createAction('UPDATE_USER'),
    setTheme: createAction('SET_THEME')
};
```

### 3. Reducer Pattern

```javascript
function reducer(state, action) {
    switch (action.type) {
        case 'UPDATE_SETTINGS':
            return {
                ...state,
                settings: {
                    ...state.settings,
                    ...action.payload
                }
            };
            
        case 'UPDATE_USER':
            return {
                ...state,
                user: {
                    ...state.user,
                    ...action.payload
                }
            };
            
        default:
            return state;
    }
}
```

### 4. Selector Pattern

```javascript
const selectors = {
    getFilteredItems: (state) => {
        const { items, filters } = state;
        return items.filter(item => {
            for (const [key, value] of Object.entries(filters)) {
                if (!value.includes(item[key])) return false;
            }
            return true;
        });
    },

    getActiveUser: (state) => state.users.active,
    
    getThemeSettings: (state) => state.settings.theme
};
```

## Best Practices

### 1. State Structure

- Keep state normalized (avoid nesting)
- Use IDs as references between entities
- Group related state
- Separate UI state from data state

Example:

```javascript
{
    entities: {
        users: {
            byId: {},
            allIds: []
        },
        posts: {
            byId: {},
            allIds: []
        }
    },
    ui: {
        activeModal: null,
        loadingStates: {},
        selectedIds: []
    },
    settings: {
        theme: 'light',
        language: 'en'
    }
}
```

### 2. State Updates

- Treat state as immutable
- Use shallow copies for updates
- Batch related updates
- Validate state changes

Example:

```javascript
function updateState(state, changes) {
    // Validate changes
    if (!validateChanges(changes)) {
        throw new Error('Invalid state update');
    }

    // Create new state object
    const newState = {
        ...state,
        ...changes
    };

    // Validate resulting state
    if (!validateState(newState)) {
        throw new Error('Invalid state');
    }

    return newState;
}
```

### 3. Performance Optimization

- Use memoization for derived data
- Implement selective updates
- Batch DOM updates
- Use immutable data structures

Example:

```javascript
const memoizedSelector = createSelector(
    state => state.items,
    state => state.filters,
    (items, filters) => {
        return items.filter(item => 
            filters.every(filter => filter(item))
        );
    }
);
```

### 4. Error Handling

- Validate state changes
- Provide error boundaries
- Handle async errors
- Roll back failed updates

Example:

```javascript
async function safeStateUpdate(store, action) {
    const previousState = store.getState();
    try {
        await store.dispatch(action);
    } catch (error) {
        // Roll back to previous state
        store.setState(previousState);
        // Log error
        logger.error('State update failed', {
            action,
            error,
            previousState
        });
        // Notify user
        store.dispatch(actions.setError(error));
    }
}
```

## Common Patterns for Specific Features

### 1. Form State

```javascript
class FormState {
    constructor(initialValues = {}) {
        this.values = initialValues;
        this.errors = {};
        this.touched = {};
        this.isSubmitting = false;
    }

    setField(name, value) {
        this.values[name] = value;
        this.touched[name] = true;
        this.validate(name);
    }

    validate(fieldName = null) {
        if (fieldName) {
            this.errors[fieldName] = this.validateField(fieldName);
        } else {
            Object.keys(this.values).forEach(name => {
                this.errors[name] = this.validateField(name);
            });
        }
    }
}
```

### 2. Pagination State

```javascript
class PaginationState {
    constructor(pageSize = 10) {
        this.currentPage = 1;
        this.pageSize = pageSize;
        this.totalItems = 0;
        this.items = [];
        this.loading = false;
    }

    get totalPages() {
        return Math.ceil(this.totalItems / this.pageSize);
    }

    setPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
    }
}
```

### 3. Filter State

```javascript
class FilterState {
    constructor() {
        this.filters = new Map();
        this.activeFilters = new Set();
    }

    addFilter(name, predicate) {
        this.filters.set(name, predicate);
    }

    toggleFilter(name) {
        if (this.activeFilters.has(name)) {
            this.activeFilters.delete(name);
        } else {
            this.activeFilters.add(name);
        }
    }

    applyFilters(items) {
        return items.filter(item =>
            Array.from(this.activeFilters).every(name => {
                const predicate = this.filters.get(name);
                return predicate(item);
            })
        );
    }
}
```

## Testing State Management

### 1. Unit Testing State Changes

```javascript
describe('Store', () => {
    let store;
    
    beforeEach(() => {
        store = new Store();
    });

    test('should update state immutably', () => {
        const initialState = store.getState();
        store.setState({ newValue: 123 });
        
        expect(store.getState()).not.toBe(initialState);
        expect(store.getState().newValue).toBe(123);
    });

    test('should notify listeners of changes', () => {
        const listener = jest.fn();
        store.subscribe(listener);
        
        store.setState({ test: true });
        
        expect(listener).toHaveBeenCalledWith(
            expect.any(Object),
            expect.any(Object)
        );
    });
});
```

### 2. Testing Selectors

```javascript
describe('Selectors', () => {
    test('should memoize results', () => {
        const selector = createSelector(
            state => state.items,
            items => items.filter(i => i.active)
        );

        const state = {
            items: [
                { id: 1, active: true },
                { id: 2, active: false }
            ]
        };

        const result1 = selector(state);
        const result2 = selector(state);
        
        expect(result1).toBe(result2);
    });
});
```

### 3. Testing Actions

```javascript
describe('Actions', () => {
    test('should create action with payload', () => {
        const updateUser = createAction('UPDATE_USER');
        const payload = { name: 'Test' };
        
        expect(updateUser(payload)).toEqual({
            type: 'UPDATE_USER',
            payload
        });
    });
});
```

## Debugging Tips

1. State Logging

```javascript
class Store {
    setState(newState) {
        const prevState = this.state;
        this.state = newState;
        
        console.log('State updated:', {
            prev: prevState,
            next: this.state,
            diff: this.calculateDiff(prevState, this.state)
        });
        
        this.notify(prevState);
    }

    calculateDiff(prev, next) {
        return Object.keys(next).reduce((diff, key) => {
            if (prev[key] !== next[key]) {
                diff[key] = {
                    from: prev[key],
                    to: next[key]
                };
            }
            return diff;
        }, {});
    }
}
```

2. Time-Travel Debugging

```javascript
class DebuggableStore extends Store {
    constructor() {
        super();
        this.history = [];
        this.currentIndex = -1;
    }

    setState(newState) {
        super.setState(newState);
        
        this.history = [
            ...this.history.slice(0, this.currentIndex + 1),
            newState
        ];
        this.currentIndex++;
    }

    undo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            super.setState(this.history[this.currentIndex]);
        }
    }

    redo() {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            super.setState(this.history[this.currentIndex]);
        }
    }
}
```

## Recommendations for Different Application Sizes

### Small Applications

- Use a simple store with state and setState
- Keep state in the most common ancestor component
- Use local state for UI-only state
- Avoid premature optimization

### Medium Applications

- Implement centralized store
- Use actions and reducers
- Add selectors for derived data
- Consider splitting state by domain

### Large Applications

- Use advanced state management libraries
- Implement middleware for side effects
- Add state persistence
- Use code splitting for state
- Implement performance optimizations

Remember to choose patterns that match your application's needs and complexity level. Don't over-engineer for small applications, but ensure your state management can scale as your application grows.
