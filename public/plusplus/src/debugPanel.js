/* eslint-disable import/prefer-default-export */
/* eslint-disable no-console */
function toggleDebugPanel() {
  const debugPanel = document.getElementById('debug-panel');
  debugPanel.style.display = debugPanel.style.display === 'block' ? 'none' : 'block';
}
let jsonLdString;
let dcString;
let coString;
function createDebugPanel() {
  const debugPanel = document.createElement('div');
  debugPanel.id = 'debug-panel';

  // Set initial styles for the debug panel
  debugPanel.style.display = 'none';
  debugPanel.style.position = 'fixed';
  debugPanel.style.top = '0';
  debugPanel.style.left = '0';
  debugPanel.style.width = '50%';
  debugPanel.style.height = '100vh';
  debugPanel.style.overflowY = 'auto';
  debugPanel.style.zIndex = '9998';
  debugPanel.style.backgroundColor = 'white';
  debugPanel.style.margin = '2em 10px';
  debugPanel.style.border = '1px solid black';

  // Build the content of the debug panel
  let clientDebug = window.siteConfig['$system:projectname$'] ? window.siteConfig['$system:projectname$'] : 'No name given';

  clientDebug = `${clientDebug}<br>${window.cmsplus?.callbackDebugAnalytics?.()}`;
  let content = `${clientDebug}<br>`;
  content = `${content}<h3>Variables</h3>`;

  if (jsonLdString.length > 2) {
    content += `<p><strong>JSON-LD:</strong> <pre>${jsonLdString}</pre></p>`;
  }
  if (dcString.length > 2) {
    content += `<p><strong>Dublin Core:</strong> <pre>${dcString}</pre></p>`;
  }
  if (coString.length > 2) {
    content += `<p><strong>Content Ops:</strong> <pre>${coString}</pre></p>`;
  }
  // Define the Regular Expression pattern to match $word:word$ patterns
  const pattern = /\$[a-zA-Z0-9_]+:[a-zA-Z0-9_]+\$/g;
  const matches = content.match(pattern) || [];

  if (matches.length > 0) {
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const match of matches) {
      const token = match.replace('$', '').replace(':', '');
      content = `<strong>${token}:</strong> ${window.siteConfig[token]}<br>${content}`;
      content = `<h3>Unmatched Replaceable Tokens</h3>${content}`;
    }
  }
  content += '<h3>site configuration</h3>';
  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const key in window.siteConfig) {
    if (key.indexOf(':.') !== 0) {
      content += `<strong>${key}:</strong> ${window.siteConfig[key]}<br>`;
    }
  }
  content = `<h2>Debug Panel, Shift-Ctrl-d to close</h2>${content}`;
  debugPanel.innerHTML = content;
  document.body.appendChild(debugPanel);
  // Event listener for keyboard shortcut
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'D') { // Ctrl + Shift + D
      toggleDebugPanel();
    }
  });
}
export function initializeDebugPanel(jsonLdStringInit, dcStringInit, coStringInit) {
  jsonLdString = jsonLdStringInit;
  dcString = dcStringInit;
  coString = coStringInit;
  window.cmsplus.callbackCreateDebugPanel = createDebugPanel;
}
// initializeDebugPanel('', '', '');
