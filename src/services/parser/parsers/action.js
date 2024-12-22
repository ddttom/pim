import { createLogger } from '../../../utils/logger.js';
import { validatePatternMatch, calculateBaseConfidence } from '../utils/patterns.js';

const logger = createLogger('ActionParser');

// Module-level pattern definitions for performance
const ACTION_PATTERNS = {
  todo: /\b(TODO|TO-DO):\s*(.+)$/im,
  action: /\b(ACTION):\s*(.+)$/im,
  task: /\b(TASK):\s*(.+)$/im
};

export const name = 'action';

export async function parse(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }

  const results = [];

  for (const [type, pattern] of Object.entries(ACTION_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) {
      const value = await extractValue(matches);
      const confidence = calculateConfidence(matches, text);
      
      results.push({
        type: 'action',
        subtype: type,
        value,
        confidence,
        metadata: {
          pattern: pattern.source,
          originalMatch: matches[0]
        }
      });
    }
  }

  return results;
}

function extractValue(matches) {
  return matches[2].trim();
}

function calculateConfidence(matches, fullText) {
  // Base confidence
  let confidence = 0.7;

  // Increase confidence based on match position and context
  if (matches.index === 0) confidence += 0.1;
  if (matches[0].toUpperCase() === matches[0]) confidence += 0.1;
  
  // Cap confidence at 1.0
  return Math.min(confidence, 1.0);
}
