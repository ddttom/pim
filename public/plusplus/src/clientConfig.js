/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable import/no-absolute-path */
/* eslint-disable import/no-unresolved */
// Place any Client-Centered Code/Configuration in here
import { loadScript } from '/scripts/aem.js';
import { getConfigTruth } from './variables.js';

async function loadModule(moduleName, functionName) {
  try {
    const module = await import(moduleName);
    if (typeof module[functionName] === 'function') {
      return module[functionName];
    }
    // eslint-disable-next-line no-console
    console.error(`Function '${functionName}' not found in module '${moduleName}'`);
    return null;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error loading module '${moduleName}':`, error);
    return null;
  }
}

function enableDanteChat() {
  window.cmsplus.debug('enableDanteChat');
  window.danteEmbed = `https://chat.dante-ai.com/embed?${window.cmsplus.helpapi}&mode=false&bubble=true&image=null&bubbleopen=false`;
  // eslint-disable-next-line no-undef
  loadScript('https://chat.dante-ai.com/bubble-embed.js');
  // eslint-disable-next-line no-undef
  loadScript('https://chat.dante-ai.com/dante-embed.js');
}

export default async function enableTracking() {
  window.cmsplus.debug('enableTracking');
  // if cookiebot
  if (window.siteConfig?.['$system:cookiebotid$']) {
    const attrs = {
      id: 'Cookiebot',
      'data-cbid': `${window.siteConfig['$system:cookiebotid$']}`,
      'data-blockingmode': 'auto',
    };
    await loadScript('https://consent.cookiebot.com/uc.js', attrs);
  }
  // if abtasty
  if (window.siteConfig?.['$system:abtastyscript$']) {
    loadScript(`${window.siteConfig['$system:abtastyscript$']}`, {});
  }
  // if tracking, you only get here if enabletracking is set to true
  await loadScript(`${window.siteConfig['$system:trackingscript$']}`, {});
  window.cmsplus.debug('tracking script loaded');
  if ((window.siteConfig?.['$system:trackingscript$']).includes('.adobe')) {
    window.adobeDataLayer = window.adobeDataLayer || [];
    try {
      if (window.cmsplus?.track) {
        if (window.cmsplus.track?.page) {
          window.adobeDataLayer.push(window.cmsplus.track.page);
        }
        if (window.cmsplus.track?.content) {
          window.adobeDataLayer.push(window.cmsplus.track.content);
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('failed to add cmsplus data to adobeDataLayer', e);
    }
  }
  if ((window.siteConfig?.['$system:trackingscript$']).includes('.googletagmanager')) {
    window.dataLayer = window.dataLayer || [];
    // eslint-disable-next-line no-inner-declarations
    function gtag() {
      // eslint-disable-next-line no-undef, prefer-rest-params
      dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', window.siteConfig['$system:gtmid$']);
  }
}

export async function initializeClientConfig() {
  window.cmsplus.debug('initialize clientConfig');
  if (window.siteConfig['$system:trackingscript$']?.includes('.adobe')) {
    const initializeTracker = await loadModule('./adobe-metadata.js', 'initializeTracker');
    if (initializeTracker) {
      window.cmsplus.callbackMetadataTracker = initializeTracker;
    }
  }
  if (getConfigTruth('$system:enabletracking$')) {
    if (getConfigTruth['$system:enableslowtracking$']) {
      window.cmsplus.callbackAfter3SecondsChain.push(enableTracking);
    } else {
      window.cmsplus.callbackPageLoadChain.push(enableTracking);
    }
  }
  if (((window.cmsplus.helpapi) || '').length > 0) {
    window.cmsplus.callbackAfter3SecondsChain.push(enableDanteChat);
  }
  window.cmsplus.debug('finished initialize clientConfig');
}
