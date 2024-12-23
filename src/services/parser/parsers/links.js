import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('LinksParser');

export const name = 'links';

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function parse(text) {
  if (!text || typeof text !== 'string') {
    return {
      type: 'error',
      error: 'INVALID_INPUT',
      message: 'Input must be a non-empty string'
    };
  }

  const patterns = {
    markdown_link: /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/i,
    file_link: /\[file:([^\]]+)\]/i,
    url: /\b(https?:\/\/[^\s<>)"']+)/i,
    inferred_url: /\b((?:[\w-]+\.)+(?:com|org|net|edu|gov|io)(?:\/[^\s]*)?)/i
  };

  let bestMatch = null;
  let highestConfidence = 0;

  for (const [pattern, regex] of Object.entries(patterns)) {
    const match = text.match(regex);
    if (match) {
      let confidence;
      let value;

      switch (pattern) {
        case 'url': {
          if (!isValidUrl(match[1])) {
            continue;
          }
          confidence = 0.95;
          value = {
            url: match[1],
            type: 'url'
          };
          break;
        }

        case 'markdown_link': {
          if (!isValidUrl(match[2])) {
            continue;
          }
          confidence = 0.95;
          value = {
            url: match[2],
            text: match[1],
            type: 'markdown'
          };
          break;
        }

        case 'file_link': {
          const path = match[1].trim();
          if (!path) {
            continue;
          }
          confidence = 0.9;
          value = {
            path,
            type: 'file'
          };
          break;
        }

        case 'inferred_url': {
          confidence = 0.75;
          value = {
            url: `https://${match[1]}`,
            type: 'url'
          };
          break;
        }
      }

      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatch = {
          type: 'link',
          value,
          metadata: {
            confidence,
            pattern,
            originalMatch: match[0]
          }
        };
      }
    }
  }

  return bestMatch;
}
