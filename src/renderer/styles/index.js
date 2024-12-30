// CSS Variables
const cssVariables = {
  // Colors
  '--primary-color': '#007bff',
  '--primary-color-dark': '#0056b3',
  '--secondary-color': '#6c757d',
  '--success-color': '#28a745',
  '--success-color-dark': '#218838',
  '--danger-color': '#dc3545',
  '--warning-color': '#ffc107',
  '--info-color': '#17a2b8',
  '--background-color': '#ffffff',
  '--text-color': '#212529',
  '--border-color': '#dee2e6',
  '--hover-color': '#f8f9fa',

  // Spacing
  '--spacing-xs': '4px',
  '--spacing-sm': '8px',
  '--spacing-md': '16px',
  '--spacing-lg': '24px',
  '--spacing-xl': '32px',

  // Typography
  '--font-family': 'system-ui, -apple-system, sans-serif',
  '--font-size-sm': '12px',
  '--font-size-md': '14px',
  '--font-size-lg': '16px',
  '--font-size-xl': '18px',

  // Other
  '--border-radius': '4px',
  '--transition-speed': '0.2s',
  '--transition-timing': 'ease'
};

// Apply CSS variables
export function initializeStyles() {
  const root = document.documentElement;
  Object.entries(cssVariables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

// Initialize styles when imported
initializeStyles();
