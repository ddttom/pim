/* eslint-disable import/no-absolute-path */
/* eslint-disable import/no-unresolved */
import { createExpression } from '/plusplus/plugins/expressions/src/expressions.js';
import {
  a, div, p, h3, h2,
} from '/plusplus/block-party/dom-helpers.js';
// a sample expression, expands the text in the siteConfig, from the args
createExpression('expand', ({ args }) => window.siteConfig?.[args] || args);

createExpression('expandlist', ({ args }) => {
  let ret = '';
  const list = args.split(',');
  list.forEach((item) => {
    ret = `${ret + (window.siteConfig?.[item.trim()] || item)}<br>`;
  });
  const para = document.createElement('p');
  para.innerHTML = ret;
  return para;
});

// {{expandprofile,$profile:name$, $profile:title$, $profile:bio$, $profile:linkedinurl$ }}
createExpression('expandprofile', ({ args }) => {
  const list = args.split(';');

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < list.length; i++) {
    list[i] = window.siteConfig?.[list[i].trim()] || list[i].trim();
  }
  const profilename = list[0];
  const profiletitle = list[1];
  const profilebio = list[2];
  const linkedinurl = list[3];
  const linkedintitle = list[4];

  const profileContainer = div(
    h2(profilename),
    h3(profiletitle),
    p(profilebio),
    a({ href: linkedinurl, title: linkedintitle }, linkedinurl),
  );
  return profileContainer;
});
