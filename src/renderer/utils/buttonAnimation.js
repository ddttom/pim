/**
 * Animates a button through its success state
 * @param {HTMLButtonElement} button - The button element to animate
 * @param {string} successText - Text to show during success state (e.g., 'Saved', 'Copied')
 * @param {string} originalText - Original button text to restore (e.g., 'Save', 'Copy')
 */
export function animateButtonSuccess(button, successText, originalText) {
  // Store original classes
  const originalClasses = [...button.classList];
  
  // Add success class and update text
  button.classList.add('button-success');
  const originalContent = button.innerHTML;
  const btnLabel = button.querySelector('.btn-label');
  if (btnLabel) {
    btnLabel.textContent = successText;
  } else {
    button.textContent = successText;
  }
  
  // After 2 seconds, restore original state
  setTimeout(() => {
    button.classList.remove('button-success');
    button.innerHTML = originalContent;
  }, 2000);
}
