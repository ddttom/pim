/*
 * State Management Service
 * 
 * A centralized store implementation that manages application state using
 * a unidirectional data flow pattern. This service:
 * 
 * - Maintains a single source of truth for application state
 * - Provides predictable state updates through actions
 * - Enables state change subscriptions for UI updates
 * - Validates state integrity
 * - Handles errors gracefully
 * 
 * Architecture:
 * - Uses action creators for type-safe state mutations
 * - Implements reducer pattern for state updates
 * - Provides selectors for efficient state access
 * - Maintains immutable state updates
 * 
 * Example Usage:
 * ```
 * stateManager.dispatch(actions.setTheme('dark'));
 * const theme = selectors.getCurrentTheme(stateManager.getState());
 * ```
 */
import { createLogger } from '../utils/logger.js';
import { ActionTypes, State, ErrorMessages } from '../constants.js';

const logger = createLogger('StateManager');

// Re-export ActionTypes for backward compatibility
export { ActionTypes };

/*
 * Action Creators
 * 
 * Factory functions that create action objects for state mutations.
 * Each action creator:
 * - Ensures consistent action structure
 * - Provides type safety through predefined types
 * - Encapsulates action payload creation
 * - Documents the expected payload shape
 * 
 * Action Structure:
 * {
 *   type: ActionTypes.ACTION_NAME,
 *   payload: any
 * }
 */
export const actions = {
    setModal: (modalId) => ({
        type: ActionTypes.SET_MODAL,
        payload: modalId
    }),
    
    setTheme: (theme) => ({
        type: ActionTypes.SET_THEME,
        payload: theme
    }),
    
    setEditorState: (state) => ({
        type: ActionTypes.SET_EDITOR_STATE,
        payload: state
    }),
    
    setParserResults: (results) => ({
        type: ActionTypes.SET_PARSER_RESULTS,
        payload: results
    }),
    
    updateParserStats: (stats) => ({
        type: ActionTypes.UPDATE_PARSER_STATS,
        payload: stats
    }),
    
    updateSettings: (settings) => ({
        type: ActionTypes.UPDATE_SETTINGS,
        payload: settings
    }),
    
    setError: (error) => ({
        type: ActionTypes.SET_ERROR,
        payload: error
    }),
    
    setEntries: (entries) => ({
        type: ActionTypes.SET_ENTRIES,
        payload: entries
    }),
    
    updateEntry: (entry) => ({
        type: ActionTypes.UPDATE_ENTRY,
        payload: entry
    }),
    
    deleteEntry: (entryId) => ({
        type: ActionTypes.DELETE_ENTRY,
        payload: entryId
    })
};

/*
 * Selectors
 * 
 * Pure functions that extract and compute derived data from the state.
 * Benefits:
 * - Encapsulates state shape knowledge
 * - Enables efficient memoization
 * - Simplifies state access
 * - Provides computed/derived values
 * 
 * Usage:
 * Prefer selectors over direct state access to maintain
 * encapsulation and enable future optimizations.
 */
export const selectors = {
    getActiveModal: (state) => state.ui.activeModal,
    getCurrentTheme: (state) => state.ui.theme,
    getEditorState: (state) => state.ui.editor,
    getParserResults: (state) => state.parser.results,
    getParserStats: (state) => state.parser.stats,
    getSettings: (state) => state.settings,
    getError: (state) => state.error,
    getEntries: (state) => state.entries.list,
    getEntryById: (state, id) => state.entries.list.find(entry => entry.id === id)
};

// Use initial state from constants
const initialState = State.InitialState;

// State Manager Class
class StateManager {
    constructor() {
        this.state = initialState;
        this.listeners = new Set();
    }

    /*
     * Returns the current application state
     * 
     * This is the only method that should be used to access
     * the raw state object. All other state access should
     * use selectors for better encapsulation.
     * 
     * Returns: The complete state object
     */
    getState() {
        return this.state;
    }

    /*
     * Updates the application state
     * 
     * Performs an immutable state update while:
     * - Preserving the previous state
     * - Validating the new state
     * - Notifying subscribers
     * 
     * @param {Object} newState - Partial or complete new state
     * @throws {Error} If state validation fails
     */
    setState(newState) {
        const prevState = {...this.state};
        this.state = this.validateState({...this.state, ...newState});
        this.notifyListeners(prevState);
    }

    /*
     * Dispatches an action to update state
     * 
     * Core method for state mutations that:
     * - Logs action for debugging
     * - Processes action through reducer
     * - Handles errors gracefully
     * - Updates error state on failure
     * 
     * @param {Object} action - Action object with type and payload
     */
    dispatch(action) {
        logger.debug('Dispatching action:', action.type);
        
        try {
            const newState = this.reducer(this.state, action);
            this.setState(newState);
        } catch (error) {
            logger.error('Error dispatching action:', error);
            this.setState({
                ...this.state,
                error: {
                    message: error.message,
                    action: action.type
                }
            });
        }
    }

    /*
     * Subscribes to state changes
     * 
     * Allows components to react to state updates:
     * - Returns unsubscribe function
     * - Provides previous state for comparison
     * - Handles listener errors gracefully
     * 
     * @param {Function} listener - Callback(newState, prevState)
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // Notify listeners of state changes
    notifyListeners(prevState) {
        for (const listener of this.listeners) {
            try {
                listener(this.state, prevState);
            } catch (error) {
                logger.error('Error in state change listener:', error);
            }
        }
    }

    /*
     * Main Reducer
     * 
     * Pure function that determines how to update state based on actions.
     * Implementation:
     * - Handles each action type
     * - Maintains immutability
     * - Preserves unaffected state
     * - Returns new state object
     * 
     * @param {Object} state - Current state
     * @param {Object} action - Action to process
     * @returns {Object} New state
     */
    reducer(state, action) {
        switch (action.type) {
            case ActionTypes.SET_MODAL:
                return {
                    ...state,
                    ui: {
                        ...state.ui,
                        activeModal: action.payload
                    }
                };

            case ActionTypes.SET_THEME:
                return {
                    ...state,
                    ui: {
                        ...state.ui,
                        theme: action.payload
                    }
                };

            case ActionTypes.SET_EDITOR_STATE:
                return {
                    ...state,
                    ui: {
                        ...state.ui,
                        editor: {
                            ...state.ui.editor,
                            ...action.payload
                        }
                    }
                };

            case ActionTypes.SET_PARSER_RESULTS:
                return {
                    ...state,
                    parser: {
                        ...state.parser,
                        results: action.payload
                    }
                };

            case ActionTypes.UPDATE_PARSER_STATS:
                return {
                    ...state,
                    parser: {
                        ...state.parser,
                        stats: {
                            ...state.parser.stats,
                            ...action.payload
                        }
                    }
                };

            case ActionTypes.UPDATE_SETTINGS:
                return {
                    ...state,
                    settings: {
                        ...state.settings,
                        ...action.payload
                    }
                };

            case ActionTypes.SET_ERROR:
                return {
                    ...state,
                    error: action.payload
                };

            case ActionTypes.SET_ENTRIES:
                return {
                    ...state,
                    entries: {
                        ...state.entries,
                        list: action.payload
                    }
                };

            case ActionTypes.UPDATE_ENTRY:
                return {
                    ...state,
                    entries: {
                        ...state.entries,
                        list: state.entries.list.map(entry =>
                            entry.id === action.payload.id ? action.payload : entry
                        )
                    }
                };

            case ActionTypes.DELETE_ENTRY:
                return {
                    ...state,
                    entries: {
                        ...state.entries,
                        list: state.entries.list.filter(entry => entry.id !== action.payload)
                    }
                };

            default:
                return state;
        }
    }

    /*
     * Validates State Updates
     * 
     * Ensures state integrity by:
     * - Checking required properties
     * - Validating property types
     * - Verifying data structures
     * - Maintaining state shape
     * 
     * @param {Object} state - State to validate
     * @returns {Object} Validated state
     * @throws {Error} If validation fails
     */
    validateState(state) {
        // First ensure all required top-level properties exist
        const requiredProps = ['ui', 'parser', 'settings', 'entries'];
        for (const prop of requiredProps) {
            if (!state[prop]) {
                throw new Error(`Missing required state property: ${prop}`);
            }
        }

        // Then validate nested properties
        if (state.ui && typeof state.ui.theme !== 'string') {
            throw new Error('Theme must be a string');
        }

        if (state.parser && !Array.isArray(state.parser.results)) {
            throw new Error('Parser results must be an array');
        }

        if (state.entries && !Array.isArray(state.entries.list)) {
            throw new Error('Entries list must be an array');
        }

        return state;
    }

    // Reset state to initial values
    reset() {
        this.setState(initialState);
    }
}

// Create and export singleton instance
export const stateManager = new StateManager();

// Export for testing
export const createStateManager = () => new StateManager();
