import Editor from './components/Editor.js';

console.log('Renderer script loaded');

// Function to initialize editor
function initializeEditor() {
    try {
        const editorContainer = document.getElementById('editor-container');
        if (!editorContainer) {
            throw new Error('Editor container not found');
        }
        console.log('Found editor container, initializing editor');
        window.editor = new Editor(editorContainer);
    } catch (error) {
        console.error('Failed to initialize editor:', error);
    }
}

// Call initialization when editor view is shown
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    initializeEditor();
});

// Export for use by other modules
export { initializeEditor };
