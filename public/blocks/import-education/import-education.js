export default function decorate(block) {
  const educations = block.querySelectorAll('.education-item');
  const isLimited = block.classList.contains('limit');
  const limit = isLimited ? parseInt(block.children[block.children.length - 1]?.textContent, 10) || Infinity : Infinity;
  
  if (educations.length === 0) {
    // eslint-disable-next-line no-console
    console.warn('No education items found');
  }

  const template = `
    <h2>Education</h2>
    ${Array.from(educations).slice(0, limit).map(edu => {
      const school = edu.querySelector('h3')?.textContent || 'School Not Found';
      const degree = edu.querySelector('.degree')?.textContent || '';
      const years = edu.querySelector('.years')?.textContent || '';

      return `
        <div class="education-item">
          <img class="school-logo" src="https://allabout.network/media_1d92670adcfb7a18a062e49fd7967f4e9f76d8a52.jpeg" alt="School logo">
          <div class="education-details">
            <h3>${school}</h3>
            <div class="degree">${degree}</div>
            <div class="years">${years}</div>
          </div>
        </div>
      `;
    }).join('')}
    ${educations.length > limit ? `<div class="show-more">Show all ${educations.length} education entries</div>` : ''}
  `;
  
  block.innerHTML = template;
}
