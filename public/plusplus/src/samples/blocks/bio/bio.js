/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-absolute-path */
import { renderExpressions } from '/plusplus/plugins/expressions/src/expressions.js';

// eslint-disable-next-line no-unused-vars
export default function decorate(block) {
  const bioElement = document.querySelector('.bio');

  if (!bioElement.classList.contains('hide-author')) {
    // Find the <img> element within the .bio.block
    const imgElement = document.querySelector('.bio.block img');

    let author = '';

    // Check if the <img> element has a non-empty alt attribute
    if (imgElement && imgElement.getAttribute('alt')) {
      author = imgElement.getAttribute('alt');
    }

    // If the alt attribute is empty or not present, fall back to the <meta> tag's author content
    if (!author) {
      const metaAuthor = document.querySelector('meta[name="author"]');
      if (metaAuthor) {
        author = metaAuthor.getAttribute('content');
      }
    }

    // Create a new <strong> element to hold the author name
    const authorElement = document.createElement('strong');
    authorElement.textContent = author;

    // Find the .bio.block element
    const bioBlock = document.querySelector('.bio.block');

    // Insert the author element as the last child of the .bio.block element
    bioBlock.appendChild(authorElement);
  }
  renderExpressions(document.querySelector('.bio-wrapper'));
}
