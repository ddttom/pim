export default function decorate(block) {
  const profileInfo = block.querySelector('.profile-info');
  if (!profileInfo) {
    // eslint-disable-next-line no-console
    console.error('Profile info section not found');
    return;
  }

  const name = profileInfo.querySelector('h1')?.textContent || 'Name Not Found';
  const headline = profileInfo.querySelector('.headline')?.textContent || '';
  const location = profileInfo.querySelector('.location')?.textContent || '';
  const connections = profileInfo.querySelector('.connections')?.textContent || '';

  const isCompact = block.classList.contains('compact');

  const template = `
    ${!isCompact ? `<img src="https://allabout.network/media_188fa5bcd003e5a2d56e7ad3ca233300c9e52f1e5.png" alt="Profile background">` : ''}
    <div class="profile-info ${isCompact ? 'compact' : ''}">
      <img class="profile-picture" src="https://allabout.network/media_11fa677a5c5d2563c03ba0f229be08509492ccb60.png" alt="${name}">
      <h1>${name}</h1>
      <p class="headline">${headline}</p>
      ${!isCompact ? `
        <p class="location">${location}</p>
        <p class="connections">${connections}</p>
        <div class="actions">
          <button class="button primary-button">Message</button>
          <button class="button secondary-button">More</button>
        </div>
      ` : ''}
    </div>
  `;

  block.innerHTML = template;
}
