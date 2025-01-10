/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-absolute-path */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-restricted-syntax */
/* site configuration module */
import {
  tidyDOM,
  possibleMobileFix,
  swiftChangesToDOM,
} from './reModelDom.js';
import {
  constructGlobal,
} from './variables.js';
import {
  initializeClientConfig,
} from './clientConfig.js';
import {
  handleMetadataJsonLd,
  createJSON,
} from './jsonHandler.js';
import { } from './externalImage.js';
import {} from '/config/config.js';
import {} from '/plusplus/src/clientExpressions.js';

const releaseVersion = 'plusplus 1.0.3';

function debugMessage(message) {
  const time = new Date().toLocaleTimeString();
  // eslint-disable-next-line no-console
  console.log(`${time}: ${message}`);
}
function noAction() {
}
export async function initializeSiteConfig() {
// Determine the environment and locality based on the URL
  const getEnvironment = () => {
    // Define an array of environments with their identifying substrings in the URL

    // An Environment is defined as a normal place to serve Helix Content
    const environments = [
      { key: '.hlx.page', value: 'preview' },
      { key: '.hlx.live', value: 'live' },
      { key: '.aem.page', value: 'preview' },
      { key: '.aem.live', value: 'live' },
    ];

    for (const env of environments) {
      if (window.location.href.includes(env.key)) {
        return env.value;
      }
    }
    // If no match is found, it defaults to 'live' - hardest case.
    return 'live';
  };

  // a locality is defined as a place to serve Helix Content for a regulated industry
  const getLocality = () => {
    const localities = [
      { key: 'localhost', value: 'local' },
      { key: '127.0.0.1', value: 'local' },
      { key: '-stage', value: 'stage' },
      { key: 'fastly', value: 'preprod' },
      { key: 'preprod.', value: 'preprod' },
      { key: '-prod', value: 'prod' },
      { key: '-dev', value: 'dev' },
    ];
    for (const env of localities) {
      if (window.location.hostname.includes(env.key)) {
        return env.value;
      }
    }

    // Return 'unknown' if no match.
    return 'unknown';
  };

  window.cmsplus = {
    environment: getEnvironment(),
    locality: getLocality(),
    release: releaseVersion,
    debug: noAction,
  };
  if (window?.debug === 'y') {
    window.cmsplus.debug = debugMessage;
  }

  window.fetchVariables = !window.location.href.includes('sidekick/library.html');
  
  window.cmsplus.debug('initializing site config');
  window.cmsplus.callbackPageLoadChain = [];
  window.cmsplus.callbackAfter3SecondsChain = [];

  window.cmsplus.callbackAfter3SecondsChain.push(noAction); // set up nop.
  window.cmsplus.callbackPageLoadChain.push(noAction); // set up nop.
  possibleMobileFix('hero');
  await constructGlobal();
  swiftChangesToDOM();
  await createJSON();
  await initializeClientConfig();
  if (window.cmsplus.environment === 'preview') {
    import('./debugPanel.js');
  }
  // all configuration completed, make any further callbacks from here
  await tidyDOM();
  await handleMetadataJsonLd();
  await window.cmsplus?.callbackMetadataTracker?.();
  if (window.cmsplus.environment === 'preview') {
    window.cmsplus.callbackCreateDebugPanel?.();
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const callback of window.cmsplus.callbackPageLoadChain) {
  // eslint-disable-next-line no-await-in-loop
    await callback();
  }
  window.cmsplus.debug('site config initialized');
}
await initializeSiteConfig();
