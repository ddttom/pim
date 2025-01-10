export default function decorate(block) {
  const skills = block.querySelectorAll('li');
  const isGrid = block.classList.contains('grid');
  
  if (skills.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('No skills found');
  }

  const template = `
    <h2>Skills</h2>
    <div class="skill-items ${isGrid ? 'grid' : ''}">
      ${Array.from(skills).map(skill => `
        <div class="skill-item">
          <div class="skill-icon">${skill.textContent[0].toUpperCase()}</div>
          <div class="skill-name">${skill.textContent}</div>
        </div>
      `).join('')}
    </div>
    ${skills.length > 6 ? `<div class="show-more">Show all ${skills.length} skills</div>` : ''}
  `;
  
  block.innerHTML = template;
}
