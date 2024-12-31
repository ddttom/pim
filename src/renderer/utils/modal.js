/**
 * Dynamic modal system
 */
export class Modal {
  constructor(options = {}) {
    this.options = {
      title: options.title || '',
      content: options.content || '',
      buttons: options.buttons || [],
      headerButtons: options.headerButtons || [],
      onClose: options.onClose || (() => {}),
      width: options.width || '500px',
      height: options.height || 'auto',
      className: options.className || '',
      modalClassName: options.modalClassName || '',
      position: options.position || null
    };
    
    this.element = null;
    this.createModal();
  }

  createModal() {
    // Create modal container
    this.element = document.createElement('div');
    this.element.className = `modal ${this.options.modalClassName}`;
    
    // Create modal content
    const modalContainer = document.createElement('div');
    modalContainer.className = `modal-container ${this.options.className}`;
    modalContainer.style.width = this.options.width;
    modalContainer.style.height = this.options.height;
    
    // Store modal instance on container
    modalContainer.__modal_instance = this;
    
    // Apply custom positioning if provided
    if (this.options.position) {
      modalContainer.style.position = 'absolute';
      if (this.options.position.top) modalContainer.style.top = this.options.position.top;
      if (this.options.position.left) modalContainer.style.left = this.options.position.left;
      if (this.options.position.right) modalContainer.style.right = this.options.position.right;
      if (this.options.position.bottom) modalContainer.style.bottom = this.options.position.bottom;
      modalContainer.style.transform = 'none'; // Remove centering transform
    }
    
    // Create header
    const header = document.createElement('div');
    header.className = 'modal-header';
    // Create title
    const title = document.createElement('h2');
    title.textContent = this.options.title;
    header.appendChild(title);

    // Create header buttons container
    const headerButtonsContainer = document.createElement('div');
    headerButtonsContainer.className = 'header-buttons';

    // Add custom header buttons
    this.options.headerButtons.forEach(button => {
      const btn = document.createElement('button');
      btn.id = button.id;
      btn.className = button.className;
      if (button.tooltip) {
        btn.title = button.tooltip;
      }
      btn.innerHTML = button.icon;
      btn.onclick = button.onClick;
      headerButtonsContainer.appendChild(btn);
    });

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
      </svg>
    `;
    headerButtonsContainer.appendChild(closeBtn);

    header.appendChild(headerButtonsContainer);
    
    // Create body
    const body = document.createElement('div');
    body.className = 'modal-body';
    if (typeof this.options.content === 'string') {
      body.innerHTML = this.options.content;
    } else if (this.options.content instanceof HTMLElement) {
      body.appendChild(this.options.content);
    }
    
    // Create footer with buttons
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    this.options.buttons.forEach(button => {
      const btn = document.createElement('button');
      btn.className = button.primary ? 'primary-btn' : 'secondary-btn';
      btn.textContent = button.text;
      btn.onclick = () => {
        if (button.onClick) button.onClick();
        if (button.closeOnClick !== false) this.close();
      };
      footer.appendChild(btn);
    });
    
    // Assemble modal
    modalContainer.appendChild(header);
    modalContainer.appendChild(body);
    if (this.options.buttons.length > 0) {
      modalContainer.appendChild(footer);
    }
    this.element.appendChild(modalContainer);
    
    // Add event listeners
    closeBtn.onclick = () => this.close();
    this.element.onclick = (e) => {
      if (e.target === this.element) this.close();
    };
  }

  show() {
    document.body.appendChild(this.element);
    // Prevent scrolling of background content
    document.body.classList.add('modal-open');
    // Add show class after a small delay to trigger transition
    requestAnimationFrame(() => {
      this.element.classList.add('show');
    });
  }

  close() {
    if (this.element && this.element.parentNode) {
      // Remove show class first to trigger transition
      this.element.classList.remove('show');
      // Wait for transition to complete
      setTimeout(() => {
        this.element.parentNode.removeChild(this.element);
        // Restore scrolling
        document.body.classList.remove('modal-open');
        if (this.options.onClose) this.options.onClose();
      }, 200); // Match transition duration in CSS
    }
  }

  setContent(content) {
    const body = this.element.querySelector('.modal-body');
    if (body) {
      body.innerHTML = '';
      if (typeof content === 'string') {
        body.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        body.appendChild(content);
      }
    }
  }
}

// Example usage:
/*
const modal = new Modal({
  title: 'Settings',
  content: '<div>Settings content here</div>',
  buttons: [
    {
      text: 'Cancel',
      onClick: () => console.log('Cancel clicked')
    },
    {
      text: 'Save',
      primary: true,
      onClick: () => console.log('Save clicked')
    }
  ],
  onClose: () => console.log('Modal closed')
});

modal.show();
*/
