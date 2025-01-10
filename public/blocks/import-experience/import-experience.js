export default function decorate(block) {
  const experiences = block.querySelectorAll('.experience-item');
  const isLimited = block.classList.contains('limit');
  const limit = isLimited ? parseInt(block.children[block.children.length - 1]?.textContent, 10) || Infinity : Infinity;
  
  if (experiences.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('No experience items found');
  }

  const template = `
    <h2>Experience</h2>
    ${Array.from(experiences).slice(0, limit).map(exp => {
      const title = exp.querySelector('h3')?.textContent || 'Job Title Not Found';
      const company = exp.querySelector('.company')?.textContent || 'Company Not Found';
      const duration = exp.querySelector('.duration')?.textContent || '';

      return `
        <div class="experience-item">
          <img class="company-logo" src="https://allabout.network/media_14e918fa88c2a9a810fd454fa04f0bd152c01fed2.jpeg" alt="Company logo">
          <div class="experience-details">
            <h3>${title}</h3>
            <div class="company">${company}</div>
            <div class="duration">${duration}</div>
          </div>
        </div>
      `;
    }).join('')}
    ${experiences.length > limit ? `<div class="show-more">Show all ${experiences.length} experiences</div>` : ''}
  `;
  
  block.innerHTML = template;
}
