import { Modal } from '../../../utils/modal.js';
import { showToast } from '../../../utils/toast.js';

export class ParserManager {
    constructor(editor) {
        this.editor = editor;
        if (!this.editor) {
            console.error('Editor not initialized');
        }
    }

    setupParserButton(testParserBtn) {
        if (testParserBtn) {
            testParserBtn.addEventListener('click', async () => {
                const results = await window.api.invoke('test-parser', this.editor.getText());
                this.showParserResults(results, testParserBtn);
            });
        }
    }

    showParserResults(results, buttonElement) {
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
        copyBtn.onclick = async () => {
            try {
                await navigator.clipboard.writeText(pre.textContent);
                showToast('Copied to clipboard');
            } catch (error) {
                console.error('Failed to copy:', error);
                showToast('Failed to copy to clipboard', 'error');
            }
        };
        content.appendChild(copyBtn);

        const buttonRect = buttonElement.getBoundingClientRect();
        const modalWidth = 800; // Width of the modal
        
        const resultsModal = new Modal({
            title: 'Parser Test Results',
            content: content,
            width: modalWidth + 'px',
            position: {
                top: buttonRect.bottom + 'px',
                left: (buttonRect.right - modalWidth) + 'px'
            }
        });
        resultsModal.show();
    }
}
