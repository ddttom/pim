import { createLogger } from '../../../utils/logger.js';
const logger = createLogger('ActionParser');

export const name = 'action';

// Common action verbs that indicate tasks
// Common action verbs that indicate tasks
const ACTION_VERBS = [
  'call', 'review', 'send', 'complete', 'write', 'create', 'update', 
  'check', 'schedule', 'meet', 'finish', 'start', 'prepare', 'organize',
  'plan', 'discuss', 'contact', 'follow up', 'research', 'analyze'
].join('|');

export async function parse(text) {
  // Input validation with error object return
  if (!text || typeof text !== 'string') {
    return {
      type: 'error',
      error: 'INVALID_INPUT',
      message: 'Input must be a non-empty string'
    };
  }

  const patterns = {
    explicit_action: /\[action:([^\]]+)\]/i,
    completed_action: /[✓✔]\s*(\w+)\s+(.+)/i,
    explicit_verb: new RegExp(`\\b(?:Need\\s+to|must|should|have\\s+to)\\s+(${ACTION_VERBS})\\s+(.+)`),
    inferred_verb: new RegExp(`\\b(?:need\\s+to)\\s+(${ACTION_VERBS})\\s+(.+)`, 'i'),
    to_prefix: /\bto\s+(\w+)\s+(.+)/i,
    simple_verb: new RegExp(`\\b(${ACTION_VERBS})\\s+(.+)`, 'i')
  };

  let bestMatch = null;
  let highestConfidence = 0;

  const trimmedText = text.trim();

  for (const [pattern, regex] of Object.entries(patterns)) {
    const match = trimmedText.match(regex);
    if (match) {
      let verb;
      let object;
      let isComplete = false;
      let confidence;

      switch (pattern) {
        case 'explicit_action':
          // [action:call John] -> verb: call, object: John
          const parts = match[1].trim().split(/\s+/);
          verb = parts[0];
          object = parts.slice(1).join(' ');
          confidence = 0.95;
          break;

        case 'explicit_verb':
          verb = match[1].trim();
          object = match[2].trim();
          confidence = 0.85;
          // Store just the verb+object part for originalMatch
          const originalMatch = `${verb} ${object}`;
          break;

        case 'to_prefix':
          verb = match[1];
          object = match[2];
          confidence = 0.8;
          break;

        case 'inferred_verb':
          verb = match[1].trim();
          object = match[2].trim();
          confidence = 0.8;
          break;

        case 'simple_verb':
          verb = match[1];
          object = match[2];
          confidence = 0.75;
          break;

        case 'completed_action':
          verb = match[1];
          object = match[2];
          isComplete = true;
          confidence = 0.9;
          break;
      }

      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatch = {
          type: 'action',
          value: {
            verb: verb.toLowerCase().trim(),
            object: object.trim(),
            isComplete
          },
          metadata: {
            confidence,
            pattern,
            originalMatch: pattern === 'explicit_verb' ? `${verb} ${object}`.trim() : match[0]
          }
        };
      }
    }
  }

  return bestMatch;
}
