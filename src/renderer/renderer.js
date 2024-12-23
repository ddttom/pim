import { stateManager, actions, selectors } from '../services/state-manager.js';
import { createLogger } from '../utils/logger.js';
import { initializeEditor, handleImageUpload, showEditor, clearEditor, getEditorContent } from './editor/editorWrapper.js';
import { setupKeyboardShortcuts } from './editor/shortcuts.js';
import { loadEntriesList, showEntriesList, toggleFilters, toggleSortMenu } from './entries/entryList.js';
import { createNewEntry, loadEntry, saveEntry, getCurrentEntryId } from './entries/entryActions.js';
import { defaultSettings, applySettings, updateSidebarState } from './settings/settings.js';
import { showSettingsModal, closeSettingsModal, setupSettingsUI, saveSettings } from './settings/settingsUI.js';
import { setupAutoSync } from './sync/sync.js';
import { showToast } from './utils/toast.js';

const logger = createLogger('Renderer');

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize settings
        const settings = await window.api.invoke('get-settings');
        applySettings(settings, window.api);

        // Initialize editor
        const editor = initializeEditor();
        setupKeyboardShortcuts(editor);

        // Setup image upload
        const imageUpload = document.getElementById('image-upload');
        if (imageUpload) {
            imageUpload.addEventListener('change', async (event) => {
                const currentEntryId = getCurrentEntryId();
                if (currentEntryId) {
                    await handleImageUpload(event, currentEntryId, window.api);
                }
            });
        }

        // Setup entry type selection
        const saveAsBtn = document.getElementById('save-as-btn');
        if (saveAsBtn) {
            saveAsBtn.addEventListener('click', () => {
                const typeSelect = document.createElement('select');
                typeSelect.id = 'content-type';
                typeSelect.innerHTML = `
                    <option value="note">Note</option>
                    <option value="task">Task</option>
                    <option value="event">Event</option>
                `;
                
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content">
                        <h3>Save As</h3>
                        <div class="form-group">
                            <label for="content-type">Type:</label>
                            ${typeSelect.outerHTML}
                        </div>
                        <div class="modal-footer">
                            <button class="primary-btn">Save</button>
                            <button class="secondary-btn">Cancel</button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                const saveBtn = modal.querySelector('.primary-btn');
                saveBtn.addEventListener('click', async () => {
                    const type = modal.querySelector('#content-type').value;
                    const content = getEditorContent();
                    
                    const entryId = await window.api.invoke('add-entry', {
                        type,
                        raw: content.text,
                        html: content.html
                    });
                    
                    const typeBadge = document.createElement('div');
                    typeBadge.className = `editor-type-badge ${type}`;
                    typeBadge.textContent = type;
                    
                    document.querySelector('.editor-type-badge')?.remove();
                    document.querySelector('.editor-actions').appendChild(typeBadge);
                    
                    modal.remove();
                });
                
                modal.querySelector('.secondary-btn').addEventListener('click', () => {
                    modal.remove();
                });
            });
        }

        // Setup settings listener
        window.api.on('settings-loaded', (newSettings) => {
            applySettings(newSettings, window.api);
        });

        // Setup auto sync
        setupAutoSync(window.api);

    } catch (error) {
        logger.error('Initialization error:', error);
        showToast('Failed to initialize application', 'error');
    }
});

// State change subscription
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
