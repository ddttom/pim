export default async function decorate(block) {
  const cube = document.createElement('div');
  cube.className = 'cube';
  
  const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
  const rows = [...block.children];
  
  faces.forEach((face, index) => {
    if (rows[index]) {
      const [imageCell, linkCell] = rows[index].children;
      const img = imageCell.querySelector('img');
      const link = linkCell.querySelector('a');
      
      if (img && link) {
        const faceSide = document.createElement('div');
        faceSide.className = `cube__face cube__face--${face}`;
        faceSide.style.backgroundImage = `url(${img.src})`;
        faceSide.dataset.href = link.href;
        cube.appendChild(faceSide);
      }
    }
  });

  block.textContent = '';
  block.appendChild(cube);

  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let rotationX = 0;
  let rotationY = 0;

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaMove = {
      x: e.clientX - previousMousePosition.x,
      y: e.clientY - previousMousePosition.y,
    };

    rotationY += deltaMove.x * 0.5;
    rotationX -= deltaMove.y * 0.5;

    cube.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  };

  cube.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  document.addEventListener('mousemove', handleMouseMove);

  cube.addEventListener('dblclick', (e) => {
    const face = e.target.closest('.cube__face');
    if (face && face.dataset.href) {
      window.location.href = face.dataset.href;
    }
  });

  // Position the first image correctly on page load
  rotationY = -90;
  cube.style.transform = `rotateX(0deg) rotateY(${rotationY}deg)`;
}