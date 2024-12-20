import { Modal } from './renderer/utils/modal.js';
import { loadEntriesList, setupSearchListener, setupNavigationListener, setupSortListener } from './renderer/entries/entryList.js';
import { EditorModal } from './renderer/editor/EditorModal.js';
import { showToast } from './renderer/utils/toast.js';

console.log('Renderer script loaded');

// Function to show settings modal
async function showSettingsModal() {
    const { setupSettingsUI, saveSettings } = await import('./renderer/settings/settingsUI.js');
    const { defaultSettings } = await import('./renderer/settings/settings.js');
    
    const settings = await window.ipcRenderer.invoke('get-settings') || defaultSettings;
    
    const modal = new Modal({
        title: 'Settings',
        content: document.createElement('div'),
        buttons: [
            {
                text: 'Cancel',
                onClick: () => modal.close()
            },
            {
                text: 'Save Changes',
                primary: true,
                onClick: async () => {
                    try {
                        const updatedSettings = await saveSettings(settings, window.ipcRenderer);
                        await window.ipcRenderer.invoke('update-settings', updatedSettings);
                        modal.close();
                    } catch (error) {
                        console.error('Failed to save settings:', error);
                    }
                }
            }
        ]
    });
    modal.show();
    
    // Initialize settings UI in the modal
    setupSettingsUI(modal.element.querySelector('.modal-body'), settings, window.ipcRenderer);
}

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded');
    
    // Initialize entries list
    const { ipcRenderer } = window;
    if (ipcRenderer) {
        await loadEntriesList(ipcRenderer, async (id) => {
            const { loadEntry } = await import('./renderer/entries/entryActions.js');
            loadEntry(id, ipcRenderer);
        });
        setupSearchListener(ipcRenderer);
        setupNavigationListener(ipcRenderer);
        setupSortListener(ipcRenderer);
    }

    // Setup event listeners
    document.getElementById('settings-btn').addEventListener('click', showSettingsModal);
    document.getElementById('new-entry-btn').addEventListener('click', async () => {
        const { createNewEntry } = await import('./renderer/entries/entryActions.js');
        await createNewEntry(ipcRenderer);
    });
    document.getElementById('test-parser-btn').addEventListener('click', async () => {
        const editorModal = new EditorModal();
        const editor = await editorModal.show({
            title: 'Test Parser'
        });

        // Wait for user to input text
        const testBtn = document.createElement('button');
        testBtn.className = 'primary-btn';
        testBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z" fill="currentColor"/>
            </svg>
            Test Parser
        `;
        testBtn.style.marginTop = '10px';
        editor.root.parentNode.appendChild(testBtn);

        testBtn.onclick = async () => {
            const results = await window.ipcRenderer.invoke('test-parser', editor.getText());
            editorModal.close();

            const content = document.createElement('div');
            const pre = document.createElement('pre');
            pre.textContent = JSON.stringify(results, null, 2);
            content.appendChild(pre);

            const copyBtn = document.createElement('button');
            copyBtn.className = 'primary-btn';
            copyBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor"/>
                </svg>
                Copy to Clipboard
            `;
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(pre.textContent);
                showToast('Copied to clipboard');
            };
            content.appendChild(copyBtn);

            const resultsModal = new Modal({
                title: 'Parser Test Results',
                content: content,
                width: '800px'
            });
            resultsModal.show();
        };
    });
});
