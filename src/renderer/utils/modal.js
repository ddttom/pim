import modalStateManager from './modalStateManager.js';

/**
 * Dynamic modal system with state management
 */
export class Modal {
  constructor(options = {}) {
    this.options = {
      id: options.id || `modal-${Date.now()}`,
      title: options.title || '',
      content: options.content || '',
      buttons: options.buttons || [],
      onClose: options.onClose || (() => {}),
      width: options.width || '500px',
      height: options.height || 'auto',
      className: options.className || '',
      modalClassName: options.modalClassName || '',
      position: options.position || null,
      onClickOutside: options.onClickOutside || null
    };
    
    this.element = null;
    this.container = null;
    this.isDestroyed = false;
    this.isUpdating = false;

    // Register with state manager
    this.zIndex = modalStateManager.registerModal(this.options.id, {
      title: this.options.title,
      className: this.options.className,
      isVisible: false
    });

    // Subscribe to state changes
    modalStateManager.subscribe(this.options.id, this.handleStateChange.bind(this));
  }

  /**
   * Handle state changes from modal state manager
   */
  handleStateChange(action, state) {
    if (this.isDestroyed || this.isUpdating) return;

    try {
      this.isUpdating = true;

      switch (action) {
        case 'update':
          if (state.isVisible !== undefined && state.isVisible !== this.isVisible) {
            state.isVisible ? this._show() : this._close();
          }
          break;
        case 'unregister':
          this.destroy();
          break;
      }
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Create modal DOM elements
   */
  createModal() {
    if (this.element) return;

    // Create modal container
    this.element = document.createElement('div');
    this.element.className = `modal ${this.options.modalClassName}`;
    this.element.style.zIndex = this.zIndex;
    
    // Create modal content
    this.container = document.createElement('div');
    this.container.className = `modal-container ${this.options.className}`;
    this.container.style.width = this.options.width;
    this.container.style.height = this.options.height;
    
    // Apply custom positioning if provided
    if (this.options.position) {
      this.container.style.position = 'absolute';
      if (this.options.position.top) this.container.style.top = this.options.position.top;
      if (this.options.position.left) this.container.style.left = this.options.position.left;
      if (this.options.position.right) this.container.style.right = this.options.position.right;
      if (this.options.position.bottom) this.container.style.bottom = this.options.position.bottom;
      this.container.style.transform = 'none';
    }
    
    // Create header
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <h2>${this.options.title}</h2>
      <button class="close-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
        </svg>
      </button>
    `;
    
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
    this.container.appendChild(header);
    this.container.appendChild(body);
    if (this.options.buttons.length > 0) {
      this.container.appendChild(footer);
    }
    this.element.appendChild(this.container);
    
    // Add event listeners
    const closeBtn = header.querySelector('.close-btn');
    closeBtn.onclick = () => {
      if (this.options.onClickOutside) {
        this.options.onClickOutside();
      } else {
        this.close();
      }
    };

    this.element.onclick = (e) => {
      if (e.target === this.element) {
        if (this.options.onClickOutside) {
          this.options.onClickOutside();
        } else {
          this.close();
        }
      }
    };
  }

  /**
   * Internal show method
   */
  _show() {
    this.createModal();
    document.body.appendChild(this.element);
    document.body.classList.add('modal-open');
    
    requestAnimationFrame(() => {
      this.element.classList.add('show');
    });
  }

  /**
   * Public show method
   */
  show() {
    if (this.isDestroyed) return;
    modalStateManager.updateModalState(this.options.id, { isVisible: true });
  }

  /**
   * Internal close method
   */
  _close() {
    if (!this.element || this.isDestroyed) return;

    this.element.classList.remove('show');
    
    setTimeout(() => {
      if (this.element?.parentNode) {
        this.element.parentNode.removeChild(this.element);
        document.body.classList.remove('modal-open');
        if (this.options.onClose) this.options.onClose();
      }
    }, 200);
  }

  /**
   * Public close method
   */
  close() {
    if (this.isDestroyed) return;
    modalStateManager.updateModalState(this.options.id, { isVisible: false });
  }

  /**
   * Update modal content
   */
  setContent(content) {
    if (this.isDestroyed) return;

    const body = this.element?.querySelector('.modal-body');
    if (body) {
      body.innerHTML = '';
      if (typeof content === 'string') {
        body.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        body.appendChild(content);
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.isDestroyed) return;

    // Close modal if open
    this._close();

    // Cleanup state
    modalStateManager.unregisterModal(this.options.id);
    modalStateManager.unsubscribe(this.options.id, this.handleStateChange);

    // Mark as destroyed
    this.isDestroyed = true;
    this.element = null;
    this.container = null;
  }
}
