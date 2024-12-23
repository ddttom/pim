import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('TimeOfDayParser');

export const name = 'timeofday';

export async function parse(text) {
  // Return error object for invalid input
  if (!text || typeof text !== 'string') {
    return {
      type: 'error',
      error: 'INVALID_INPUT',
      message: 'Input must be a non-empty string'
    };
  }

  const patterns = {
    explicit_time: /\[time:(\d{1,2}):(\d{2})\]/i,
    '12h_time': /\b(\d{1,2}):(\d{2})\s*(am|pm)\b/i,
    natural_time: /\b(morning|afternoon|evening|night)\b/i
  };

  let bestMatch = null;
  let highestConfidence = 0;

  for (const [pattern, regex] of Object.entries(patterns)) {
    const match = text.match(regex);
    if (match) {
      let confidence;
      let value;

      switch (pattern) {
        case 'explicit_time': {
          const hour = parseInt(match[1], 10);
          const minute = parseInt(match[2], 10);
          
          if (isValidTime(hour, minute)) {
            confidence = 0.95;
            value = {
              hour,
              minute,
              format: '24h'
            };
          }
          break;
        }

        case '12h_time': {
          confidence = 0.90;
          let hour = parseInt(match[1], 10);
          const minute = parseInt(match[2], 10);
          const period = match[3].toLowerCase();

          if (period === 'pm' && hour < 12) hour += 12;
          if (period === 'am' && hour === 12) hour = 0;

          if (isValidTime(hour, minute)) {
            value = {
              hour,
              minute,
              format: '12h',
              period: period.toUpperCase()
            };
          }
          break;
        }

        case 'natural_time': {
          confidence = 0.80; // Changed back to 0.80 to match test
          const timeOfDay = match[1].toLowerCase();
          value = {
            period: timeOfDay,
            approximate: true
          };
          break;
        }
      }

      if (value && confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatch = {
          type: 'timeofday',
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

function isValidTime(hour, minute) {
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}
