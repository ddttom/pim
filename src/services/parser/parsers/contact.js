import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('ContactParser');

export const name = 'contact';

export async function parse(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }

  const patterns = {
    contact_reference: /\[contact:([^\]]+)\]/i,
    email: /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/i,
    phone: /\b(\+?\d{1,3}[-.]?\d{3}[-.]?\d{3}[-.]?\d{4})\b/i,
    name_with_role: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(([^)]+)\)/i
  };

  let bestMatch = null;
  let highestConfidence = 0;

  for (const [pattern, regex] of Object.entries(patterns)) {
    const match = text.match(regex);
    if (match) {
      let confidence;
      let value;

      switch (pattern) {
        case 'contact_reference': {
          confidence = 0.95;
          value = {
            type: 'reference',
            name: match[1].trim(),
            id: match[1].toLowerCase().replace(/\s+/g, '_')
          };
          break;
        }

        case 'email': {
          confidence = 0.95;
          const email = match[1];
          const nameParts = email.split('@')[0].split(/[._]/);
          const name = nameParts
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
          value = {
            type: 'email',
            value: email,
            name
          };
          break;
        }

        case 'phone': {
          confidence = 0.90;
          const phone = match[1];
          const cleanPhone = phone.startsWith('+') ? 
            `+${phone.replace(/[-.\s+]/g, '')}` : 
            phone.replace(/[-.\s+]/g, '');
          value = {
            type: 'phone',
            value: cleanPhone,
            formatted: phone
          };
          break;
        }

        case 'name_with_role': {
          confidence = 0.85;
          value = {
            type: 'person',
            name: match[1].trim(),
            role: match[2].trim()
          };
          break;
        }
      }

      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        bestMatch = {
          type: 'contact',
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
