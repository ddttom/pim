export default async function decorate(block) {
  const images = [];
  const rows = [...block.children];
  
  // Extract images and remove rows from DOM
  rows.forEach((row) => {
    const img = row.querySelector('img');
    if (img) {
      images.push(img.src);
    }
    row.remove();
  });

  // Shuffle images
  for (let i = images.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [images[i], images[j]] = [images[j], images[i]];
  }

  // Create carousel structure
  const carousel = document.createElement('div');
  carousel.className = 'imagecycle-carousel';
  
  const imageContainer = document.createElement('div');
  imageContainer.className = 'imagecycle-image-container';
  
  const indicators = document.createElement('div');
  indicators.className = 'imagecycle-indicators';

  images.forEach((src, index) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Carousel image ${index + 1}`;
    img.style.display = index === 0 ? 'block' : 'none';
    imageContainer.appendChild(img);

    const indicator = document.createElement('span');
    indicator.className = index === 0 ? 'active' : '';
    indicators.appendChild(indicator);
  });

  carousel.appendChild(imageContainer);
  carousel.appendChild(indicators);
  block.appendChild(carousel);

  let currentIndex = 0;
  let intervalId;

  function showImage(index) {
    const imgs = imageContainer.querySelectorAll('img');
    const dots = indicators.querySelectorAll('span');
    imgs[currentIndex].style.display = 'none';
    dots[currentIndex].className = '';
    currentIndex = (index + imgs.length) % imgs.length;
    imgs[currentIndex].style.display = 'block';
    dots[currentIndex].className = 'active';
  }

  function startRotation() {
    intervalId = setInterval(() => {
      showImage(currentIndex + 1);
    }, 5000);
  }

  function stopRotation() {
    clearInterval(intervalId);
  }

  function createArrow(direction) {
    const arrow = document.createElement('button');
    arrow.className = `imagecycle-arrow imagecycle-arrow-${direction}`;
    arrow.setAttribute('aria-label', `${direction === 'prev' ? 'Previous' : 'Next'} image`);
    arrow.innerHTML = direction === 'prev' ? '&#10094;' : '&#10095;';
    return arrow;
  }

  const prevArrow = createArrow('prev');
  const nextArrow = createArrow('next');

  prevArrow.addEventListener('click', () => {
    stopRotation();
    showImage(currentIndex - 1);
  });

  nextArrow.addEventListener('click', () => {
    stopRotation();
    showImage(currentIndex + 1);
  });

  const arrowContainer = document.createElement('div');
  arrowContainer.className = 'imagecycle-arrow-container';
  arrowContainer.appendChild(prevArrow);
  arrowContainer.appendChild(nextArrow);

  carousel.appendChild(arrowContainer);

  carousel.addEventListener('mouseenter', stopRotation);
  carousel.addEventListener('mouseleave', () => {
    showImage(currentIndex + 1);
    startRotation();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      stopRotation();
      showImage(currentIndex - 1);
    } else if (e.key === 'ArrowRight') {
      stopRotation();
      showImage(currentIndex + 1);
    }
  });

  startRotation();
}