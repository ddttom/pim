export const themePresets = {
  light: {
    primary: '#3498db',
    secondary: '#95a5a6',
    background: '#f5f5f5',
    text: '#333333',
    accent: '#2ecc71'
  },
  dark: {
    primary: '#3498db',
    secondary: '#95a5a6',
    background: '#1a1a1a',
    text: '#ffffff',
    accent: '#2ecc71'
  },
  sepia: {
    primary: '#704214',
    secondary: '#8b7355',
    background: '#f4ecd8',
    text: '#463020',
    accent: '#917147'
  },
  nord: {
    primary: '#88C0D0',
    secondary: '#81A1C1',
    background: '#2E3440',
    text: '#ECEFF4',
    accent: '#A3BE8C'
  },
  solarized: {
    primary: '#268BD2',
    secondary: '#93A1A1',
    background: '#FDF6E3',
    text: '#657B83',
    accent: '#2AA198'
  },
  dracula: {
    primary: '#BD93F9',
    secondary: '#6272A4',
    background: '#282A36',
    text: '#F8F8F2',
    accent: '#50FA7B'
  },
  monokai: {
    primary: '#F92672',
    secondary: '#75715E',
    background: '#272822',
    text: '#F8F8F2',
    accent: '#A6E22E'
  }
};

export function applyTheme(theme, settings) {
  const preset = themePresets[theme] || themePresets.light;
  const customTheme = settings?.theme?.custom || {};
  
  const finalTheme = {
    ...preset,
    ...customTheme
  };

  Object.entries(finalTheme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}-color`, value);
  });
}
