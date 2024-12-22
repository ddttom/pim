import { stateManager, actions, selectors } from '../services/state-manager.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Renderer');

// Subscribe to state changes
stateManager.subscribe((newState, prevState) => {
    // Handle UI updates based on state changes
    if (newState.ui.theme !== prevState.ui.theme) {
        updateTheme(newState.ui.theme);
    }
    
    if (newState.ui.activeModal !== prevState.ui.activeModal) {
        handleModalChange(newState.ui.activeModal);
    }
    
    if (newState.error !== prevState.error) {
        handleError(newState.error);
    }
    
    if (newState.ui.editor !== prevState.ui.editor) {
        updateEditor(newState.ui.editor);
    }
    
    if (newState.entries.list !== prevState.entries.list) {
        updateEntryList(newState.entries.list);
    }
});

// Theme handling
function updateTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    logger.debug('Theme updated:', theme);
}

// Modal handling
function handleModalChange(modalId) {
    const modalContainer = document.getElementById('modal-container');
    if (!modalId) {
        modalContainer.innerHTML = '';
        return;
    }
    
    // Load and display modal content based on modalId
    import(`./modals/${modalId}.js`)
        .then(module => {
            const modalContent = module.default();
            modalContainer.innerHTML = modalContent;
            setupModalListeners();
        })
        .catch(error => {
            logger.error('Error loading modal:', error);
            stateManager.dispatch(actions.setError({
                message: `Failed to load modal: ${modalId}`,
                error
            }));
        });
}

// Error handling
function handleError(error) {
    if (!error) return;
    
    const errorContainer = document.getElementById('error-container');
    errorContainer.innerHTML = `
        <div class="error-message">
            <h3>Error</h3>
            <p>${error.message}</p>
            <button onclick="dismissError()">Dismiss</button>
        </div>
    `;
    errorContainer.style.display = 'block';
    
    logger.error('Application error:', error);
}

// Editor handling
function updateEditor(editorState) {
    const editor = document.getElementById('editor');
    if (!editor) return;
    
    // Update content if changed and not focused
    if (!editor.matches(':focus')) {
        editor.value = editorState.content;
    }
    
    // Update selection if specified
    if (editorState.selection) {
        editor.setSelectionRange(
            editorState.selection.start,
            editorState.selection.end
        );
    }
}

// Entry list handling
function updateEntryList(entries) {
    const entryList = document.getElementById('entry-list');
    if (!entryList) return;
    
    entryList.innerHTML = entries
        .map(entry => `
            <div class="entry" data-id="${entry.id}">
                <div class="entry-content">${entry.content}</div>
                <div class="entry-actions">
                    <button onclick="editEntry('${entry.id}')">Edit</button>
                    <button onclick="deleteEntry('${entry.id}')">Delete</button>
                </div>
            </div>
        `)
        .join('');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    const currentTheme = selectors.getCurrentTheme(stateManager.getState());
    updateTheme(currentTheme);
    
    // Setup editor
    const editor = document.getElementById('editor');
    if (editor) {
        editor.addEventListener('input', (event) => {
            stateManager.dispatch(actions.setEditorState({
                content: event.target.value
            }));
        });
        
        editor.addEventListener('select', (event) => {
            stateManager.dispatch(actions.setEditorState({
                selection: {
                    start: event.target.selectionStart,
                    end: event.target.selectionEnd
                }
            }));
        });
    }
    
    // Setup theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = selectors.getCurrentTheme(stateManager.getState());
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            stateManager.dispatch(actions.setTheme(newTheme));
        });
    }
    
    // Setup settings button
    const settingsButton = document.getElementById('settings-button');
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            stateManager.dispatch(actions.setModal('settings'));
        });
    }
});

// Error dismissal
window.dismissError = () => {
    stateManager.dispatch(actions.setError(null));
};

// Entry actions
window.editEntry = (entryId) => {
    const entry = selectors.getEntryById(stateManager.getState(), entryId);
    if (entry) {
        stateManager.dispatch(actions.setEditorState({
            content: entry.content
        }));
    }
};

window.deleteEntry = (entryId) => {
    stateManager.dispatch(actions.deleteEntry(entryId));
};

// Modal setup
function setupModalListeners() {
    const closeButton = document.querySelector('.modal-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            stateManager.dispatch(actions.setModal(null));
        });
    }
}

// Export for preload script
window.stateManager = stateManager;
