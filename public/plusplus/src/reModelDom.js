/* eslint-disable max-len */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */

export function removeMeta() {
  const keepMetadataNames = [
    'description',
    'twitter:card',
    'twitter:title',
    'twitter:description',
    'twitter:image',
    'referrer',
    'viewport',
    'og:title',
    'og:description',
    'og:image',
    'og:type',
    'og:url',
    'og:site_name',
    'keywords',
    'experiment',
    'conversion-name',
    'instant-experiment',
    'theme',
    'template',
    'footer',

  ];
  const elements = document.querySelectorAll('meta[name]');

  elements.forEach((element) => {
    const name = element.getAttribute('name');
    if (!keepMetadataNames.includes(name)) {
      element.remove();
    }
  });
}
export function removeCommentBlocks() {
  document.querySelectorAll('div.section-metadata.comment').forEach((section) => section.remove());
}

function DynamicSVGWidthHeight() {
  // Add dynamic width and height to all SVG image
  const imgSvg = document.querySelectorAll('img[src$=".svg"]');
  imgSvg.forEach((img) => {
    const imgWidth = img.clientWidth;
    const imgHeight = img.clientHeight;
    img.setAttribute('width', imgWidth);
    img.setAttribute('height', imgHeight);
  });
}

export async function possibleMobileFix(container) {
  // Select the element by its class

  const firstPicture = document.querySelector(`.${container} > div:first-of-type picture`);
  const secondPicture = document.querySelector(`.${container} > div:first-of-type > div:nth-of-type(2) picture`);

  if (firstPicture && secondPicture) {
    // Select the second source element from the second picture element
    const secondSource = secondPicture.querySelector('source:nth-of-type(2)');

    if (secondSource) {
      const newSource = secondSource.cloneNode(true);
      const firstPictureSecondSource = firstPicture.querySelector('source:nth-of-type(2)');

      if (firstPictureSecondSource) {
        firstPicture.replaceChild(newSource, firstPictureSecondSource);
      } else {
        firstPicture.appendChild(newSource);
      }

      secondPicture.remove();
    }
  }
}
// perform very fast changes. before the page is shown
export function swiftChangesToDOM() {
  DynamicSVGWidthHeight();
}

const loadScript = (url, type) => {
  const main = document.querySelector('main');
  const script = document.createElement('script');
  script.src = url;
  if (type) {
    script.setAttribute('type', type);
  }
  main.append(script);
};

function inject() {
  if (window.siteConfig?.['$meta:inject$']) {
    const jsName = window.siteConfig['$meta:inject$'];
    loadScript(jsName);
  }
}

// tidyDOM is the slow fixes to the Dom that do not change styes or view
export async function tidyDOM() {
  window.cmsplus.debug('Tidy DOM');
  removeCommentBlocks();
  removeMeta();
  inject();
  if (document.querySelector('coming-soon')) {
    DocumentFragment.body.classList.add('hide');
  }
  // ---- Remove title from link with images ----- //
  // Find all <a> tags in the document
  const links = document.querySelectorAll('a');
  const containsVisualElements = (link) => link.querySelectorAll('img') || link.querySelector('picture') || link.querySelector('i[class^="icon"], i[class*=" icon"], i[class^="fa"], i[class*=" fa"]');

  // Remove title from link
  links.forEach((link) => {
    if (containsVisualElements(link)) {
      // If a title attribute exists, remove it
      if (link.hasAttribute('title')) {
        link.removeAttribute('title');
      }
    }
  });

  // Add button="role" to every blink with button class
  const buttonRole = document.querySelectorAll('.button');
  buttonRole.forEach((button) => {
    button.setAttribute('role', 'button');
  });

  // Add target blank to all external website linked on the website
  // Get the current site's domain
  const siteDomain = window.location.hostname;
  const currentPage = window.location.href;

  // Open external link in the new window
  links.forEach((link) => {
    const linkDomain = new URL(link.href).hostname;
    if (linkDomain !== siteDomain && !link.href.startsWith('/') && !link.href.startsWith('#')) {
      link.setAttribute('target', '_blank');
    }
  });
  // Add current class to any current visited
  links.forEach((link) => {
    if (link.href === currentPage) {
      link.classList.add('current');
    }
  });
  window.cmsplus.debug('Tidy DOM complete');
}
