import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ProjectParser');

export const name = 'project';

const IGNORED_TERMS = new Set(['the', 'this', 'new', 'project']);

const PROJECT_INDICATORS = {
  project_term: ['project', 'initiative', 'program'],
  task_organization: ['under', 'for', 'in', 'story'],
  stakeholder: ['client', 'team', 'department'],
  timeline: ['roadmap', 'milestone', 'sprint']
};

function validateProjectName(name) {
  if (!name || typeof name !== 'string') return false;
  
  // Length validation
  if (name.length <= 1 || name.length > 50) return false;
  
  // Character validation (alphanumeric, underscore, hyphen)
  if (/[!@#$%^&*()+={}\[\]|\\:;"'<>,.?/]/.test(name)) return false;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name)) return false;
  
  // Ignore common terms
  if (IGNORED_TERMS.has(name.toLowerCase())) return false;
  
  return true;
}

function detectIndicators(text) {
  const indicators = [];
  const lowerText = text.toLowerCase();

  for (const [type, terms] of Object.entries(PROJECT_INDICATORS)) {
    if (terms.some(term => lowerText.includes(term))) {
      indicators.push(type);
    }
  }

  return indicators;
}

export async function parse(text) {
  if (!text || typeof text !== 'string') {
    return {
      type: 'error',
      error: 'INVALID_INPUT',
      message: 'Input must be a non-empty string'
    };
  }

  try {
    // Detect indicators first
    const indicators = detectIndicators(text);

    const patterns = {
      explicit: /(?:\[project:|project:)\s*([^\]\s]+)/i,
      reference: /\bre:\s*(?:project\s+)?([^\s]+)/i,
      identifier: /\bPRJ-(\d+)\b/i,
      shorthand: /\$([^\s]+)/i,
      contextual: /(?:\b(?:project|initiative|program)\s+([^\s]+)\b)|(?:\b(?:for|in|under)\s+([^\s]+)\s+project\b)/i
    };

    let bestMatch = null;
    let highestConfidence = 0;

    for (const [pattern, regex] of Object.entries(patterns)) {
      const match = text.match(regex);
      if (match) {
        let confidence;
        let value;
        const projectName = match[1] || match[2] || '';

        // Skip invalid project names
        if (!projectName || !parse.validateProjectName(projectName)) {
          continue;
        }

        switch (pattern) {
          case 'explicit': {
            confidence = 0.95;
            value = {
              project: projectName,
              originalName: projectName
            };
            break;
          }

          case 'reference':
          case 'identifier': {
            confidence = 0.9;
            value = {
              project: projectName,
              originalName: projectName
            };
            break;
          }

          case 'shorthand': {
            confidence = 0.85;
            value = {
              project: projectName,
              originalName: projectName
            };
            break;
          }

          case 'contextual': {
            confidence = 0.8;
            value = {
              project: projectName,
              originalName: projectName
            };
            break;
          }
        }

        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = {
            type: 'project',
            value,
            metadata: {
              confidence,
              pattern,
              originalMatch: match[0],
              indicators
            }
          };
        }
      }
    }

    return bestMatch;
  } catch (error) {
    logger.error('Error in project parser:', error);
    return {
      type: 'error',
      error: 'PARSER_ERROR',
      message: error.message
    };
  }
}

// Make functions available for mocking in tests
parse.validateProjectName = validateProjectName;
