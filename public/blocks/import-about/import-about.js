export default function decorate(block) {
  const content = block.textContent.trim();
  const isTruncate = block.classList.contains('truncate');
  const truncateLength = isTruncate ? parseInt(block.children[1]?.textContent, 10) || 100 : Infinity;

  const truncatedContent = content.length > truncateLength 
    ? content.slice(0, truncateLength) + '...' 
    : content;

  const template = `
    <h2>About</h2>
    <p>${truncatedContent}</p>
    ${content.length > truncateLength ? '<div class="see-more">...see more</div>' : ''}
  `;
  block.innerHTML = template;
}
