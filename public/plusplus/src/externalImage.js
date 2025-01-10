/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-absolute-path */
// External image handling, part of block-party; but modified to be a plugin for PlusPlus
import {
  createOptimizedPicture as libCreateOptimizedPicture,
} from '/scripts/aem.js';

/**
 * Gets the extension of a URL.
 * @param {string} url The URL
 * @returns {string} The extension
 * @private
 * @example
 * get_url_extension('https://example.com/foo.jpg');
 * // returns 'jpg'
 * get_url_extension('https://example.com/foo.jpg?bar=baz');
 * // returns 'jpg'
 * get_url_extension('https://example.com/foo');
 * // returns ''
 * get_url_extension('https://example.com/foo.jpg#qux');
 * // returns 'jpg'
 */
export function getUrlExtension(url) {
  return url.split(/[#?]/)[0].split('.').pop().trim();
}

/**
   * Checks if an element is an external image.
   * @param {Element} element The element
   * @param {string} externalImageMarker The marker for external images
   * @returns {boolean} Whether the element is an external image
   * @private
   */
export function isExternalImage(element, externalImageMarker) {
  // if the element is not an anchor, it's not an external image
  if (element.tagName !== 'A') return false;

  // if the element is an anchor with the external image marker as text content,
  // it's an external image
  if (element.textContent.trim() === externalImageMarker) {
    return true;
  }

  // if the element is an anchor with the href as text content and the href has
  // an image extension, it's an external image
  if (element.textContent.trim() === element.getAttribute('href')) {
    const ext = getUrlExtension(element.getAttribute('href'));
    return ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext.toLowerCase());
  }

  return false;
}

/*
   * Appends query params to a URL
   * @param {string} url The URL to append query params to
   * @param {object} params The query params to append
   * @returns {string} The URL with query params appended
   * @private
   * @example
   * appendQueryParams('https://example.com', { foo: 'bar' });
   * // returns 'https://example.com?foo=bar'
   */
export function appendQueryParams(url, params) {
  const {
    searchParams,
  } = url;
  params.forEach((value, key) => {
    searchParams.set(key, value);
  });
  // eslint-disable-next-line no-param-reassign
  url.search = searchParams.toString();
  return url.toString();
}

/**
   * Creates an optimized picture element for an image.
   * If the image is not an absolute URL, it will be passed to libCreateOptimizedPicture.
   * @param {string} src The image source URL
   * @param {string} alt The image alt text
   * @param {boolean} eager Whether to load the image eagerly
   * @param {object[]} breakpoints The breakpoints to use
   * @returns {Element} The picture element
   *
   */
export function createOptimizedPicture(src, alt = '', eager = false, breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }]) {
  const isAbsoluteUrl = /^https?:\/\//i.test(src);

  // Fallback to createOptimizedPicture if src is not an absolute URL
  if (!isAbsoluteUrl) return libCreateOptimizedPicture(src, alt, eager, breakpoints);

  const url = new URL(src);
  const picture = document.createElement('picture');
  const { pathname } = url;
  const ext = pathname.substring(pathname.lastIndexOf('.') + 1);

  // webp
  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    const searchParams = new URLSearchParams({ width: br.width, format: 'webply' });
    source.setAttribute('srcset', appendQueryParams(url, searchParams));
    picture.appendChild(source);
  });

  // fallback
  breakpoints.forEach((br, i) => {
    const searchParams = new URLSearchParams({ width: br.width, format: ext });

    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', appendQueryParams(url, searchParams));
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', appendQueryParams(url, searchParams));
    }
  });

  return picture;
}

/*
   * Decorates external images with a picture element
   * @param {Element} ele The element
   * @param {string} deliveryMarker The marker for external images
   * @private
   * @example
   * decorateExternalImages(main, '//External Image//');
   */
export function decorateExternalImages(ele, deliveryMarker) {
  const extImages = ele.querySelectorAll('a');
  extImages.forEach((extImage) => {
    if (isExternalImage(extImage, deliveryMarker)) {
      const extImageSrc = extImage.getAttribute('href');
      const extPicture = createOptimizedPicture(extImageSrc);

      /* copy query params from link to img */
      const extImageUrl = new URL(extImageSrc);
      const {
        searchParams,
      } = extImageUrl;
      extPicture.querySelectorAll('source, img').forEach((child) => {
        if (child.tagName === 'SOURCE') {
          const srcset = child.getAttribute('srcset');
          if (srcset) {
            child.setAttribute('srcset', appendQueryParams(new URL(srcset, extImageSrc), searchParams));
          }
        } else if (child.tagName === 'IMG') {
          const src = child.getAttribute('src');
          if (src) {
            child.setAttribute('src', appendQueryParams(new URL(src, extImageSrc), searchParams));
          }
        }
      });
      extImage.parentNode.replaceChild(extPicture, extImage);
    }
  });
}
export function initializeExternalImage() {
  decorateExternalImages(document.querySelector('main'), '//External Image//');
  decorateExternalImages(document.querySelector('main'));
}

initializeExternalImage();
