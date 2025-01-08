export class RibbonManager {
    constructor(editor) {
        this.editor = editor?.editor;
        if (!this.editor) {
            console.error('Editor core not initialized');
        }
    }

    createRibbon() {
        const ribbon = document.createElement('div');
        ribbon.className = 'ribbon';

        // Create sections
        const leftSection = this.createLeftSection();
        const middleSection = this.createMiddleSection();
        const rightSection = this.createRightSection();

        // Add dividers
        const divider1 = document.createElement('div');
        divider1.className = 'ribbon-divider';
        const divider2 = document.createElement('div');
        divider2.className = 'ribbon-divider';

        // Add sections to ribbon
        ribbon.appendChild(leftSection);
        ribbon.appendChild(divider1);
        ribbon.appendChild(middleSection);
        ribbon.appendChild(divider2);
        ribbon.appendChild(rightSection);

        return ribbon;
    }

    createLeftSection() {
        const section = document.createElement('div');
        section.className = 'ribbon-section';

        // Create save buttons
        const saveBtn = this.createButton('save-btn', 'Save', 'primary-btn', 'Ctrl+S', `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM19 19H5V5H16.17L19 7.83V19ZM12 12C10.34 12 9 13.34 9 15C9 16.66 10.34 18 12 18C13.66 18 15 16.66 15 15C15 13.34 13.66 12 12 12ZM6 6H15V10H6V6Z" fill="currentColor"/>
            </svg>
        `);

        const saveAsBtn = this.createButton('save-as-btn', 'Save As', 'secondary-btn', null, `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM19 19H5V5H16.17L19 7.83V19ZM12 12C10.34 12 9 13.34 9 15C9 16.66 10.34 18 12 18C13.66 18 15 16.66 15 15C15 13.34 13.66 12 12 12ZM6 6H15V10H6V6Z" fill="currentColor"/>
            </svg>
        `);

        section.appendChild(saveBtn);
        section.appendChild(saveAsBtn);

        return section;
    }

    createMiddleSection() {
        const section = document.createElement('div');
        section.className = 'ribbon-section';

        const imageBtn = this.createButton('image-btn', 'Images', 'secondary-btn', null, `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
            </svg>
        `);

        section.appendChild(imageBtn);

        return section;
    }

    createRightSection() {
        const section = document.createElement('div');
        section.className = 'ribbon-section';

        const testParserBtn = this.createButton('test-parser-btn', 'Test Parser', 'secondary-btn', null, `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-4h11v4zm0-5H4V9h11v4zm5 5h-4V9h4v9z" fill="currentColor"/>
            </svg>
        `);

        section.appendChild(testParserBtn);

        return section;
    }

    createButton(id, label, className, shortcut, icon) {
        const btn = document.createElement('button');
        btn.id = id;
        btn.className = `${className} ribbon-btn`;
        if (shortcut) {
            btn.setAttribute('data-shortcut', shortcut);
        }
        btn.innerHTML = `
            <span class="btn-icon">${icon}</span>
            <span class="btn-label">${label}</span>
        `;
        return btn;
    }
}
