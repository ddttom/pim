// eslint-disable-next-line no-unused-vars
export default async function decorate(block) {
  const returnToTopButton = document.querySelector('.returntotop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      returnToTopButton.style.display = 'block';
    } else {
      returnToTopButton.style.display = 'none';
    }
  });

  // Scroll to top when the button is clicked
  returnToTopButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
}
