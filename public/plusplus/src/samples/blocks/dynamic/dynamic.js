/* eslint-disable import/no-absolute-path */
/* eslint-disable import/no-unresolved */
/* eslint-disable function-paren-newline */
/* eslint-disable import/extensions */
/* eslint-disable no-alert */

import { createOptimizedPicture } from '../../scripts/aem.js';
import {
  a, div, li, p, h3, span, ul,
} from '/plusplus/block-party/dom-helpers.js';
import ffetch from '/plusplus/block-party/ffetch.js';

export default async function decorate(block) {
// Select the element by its class
  const element = document.querySelector('.dynamic-container');

  // Get the value of the 'data-maxreturn' attribute, or system value, or use the default value of 8
  let maxReturn = element.getAttribute('data-maxreturn') || window.siteConfig?.['$meta:maxreturn$'] || window.siteConfig?.['$system:maxreturn$'] || '8';

  if (maxReturn === '-1') {
    maxReturn = 1000;
  }
  const content = await ffetch('/query-index.json').all();

  let targetNames = ['blog']; // Initialize targetNames with 'blog' as the default

  if (!window.location.pathname.endsWith('/')) {
  // Extract path segments excluding the domain
    const pathSegments = window.location.pathname.split('/').filter((segment) => segment.length > 0);

    // Use the pathname as target if there's more than one segment
    if (pathSegments.length > 1) {
      targetNames = [window.location.pathname];
    }
  }

  // Use additional class names as targets, excluding specific class names
  let bnames = block.className.replace(' block', '');
  if (bnames.startsWith('dynamic')) {
    bnames = bnames.replace('dynamic', '');
  }
  bnames = bnames.trim();
  if (bnames.split(' ').length > 1) {
    targetNames = bnames.split(' ');
  }
  // Filter content to exclude paths containing '/template' and the current page path
  const filteredContent = content.filter((card) => {
    const isTemplatePath = card.path.includes('/template');
    const isFragmentPath = card.path.includes('/fragment');
    const isTestPath = card.path.includes('/test');
    const isDraftsPath = card.path.includes('/drafts');
    const isCurrentPage = card.path === window.location.pathname;
    const isTargetPath = targetNames.some((target) => card.path.includes(`/${target}/`));

    // eslint-disable-next-line max-len
    return !isTemplatePath && !isTestPath && !isDraftsPath && !isFragmentPath && !isCurrentPage && isTargetPath;
  });
  // Sort the filtered content by 'lastModified' in descending order
  const sortedContent = filteredContent.sort((adate, b) => {
    const dateA = new Date(adate.lastModified);
    const dateB = new Date(b.lastModified);
    return dateB - dateA;
  });

  const maxReturnNumber = parseInt(maxReturn, 10);

  // Append sorted and filtered content to the block, obeying limits
  block.append(
    ul(
      ...sortedContent.slice(0, maxReturnNumber).map((card) => li(
        div({ class: 'card-image' },
          a({ href: card.path }, // Link wrapping the image
            createOptimizedPicture(card.image, card.headline, false, [{ width: '750' }]),
          ),
        ),
        div({ class: 'cards-card-body' },
          span({ class: 'card-tag' }, card.service),
          span({ class: 'card-tag alt' }, card.resource),
          h3((card.headline)),
          p(card.description),
        ),
      )),
    ),
  );
}
