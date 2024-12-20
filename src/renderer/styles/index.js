// Function to load CSS file
function loadCSS(path) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = path;
  document.head.appendChild(link);
}

// Load all CSS files
export function initializeStyles() {
  const styles = [
    'styles/base.css',
    'styles/ribbon.css',
    'styles/sidebar.css',
    'styles/entries.css',
    'styles/editor.css',
    'styles/modals.css',
    'styles/theme.css'
  ];

  styles.forEach(loadCSS);

  // Apply theme based on system preference
  const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (darkMode) {
    document.body.classList.add('dark');
  }
}

// Export a function to update theme
export function updateTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

// Export a function to get current theme
export function getCurrentTheme() {
  return document.body.classList.contains('dark') ? 'dark' : 'light';
}
