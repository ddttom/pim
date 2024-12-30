function getDateFormatOptions(format) {
  switch (format) {
    case 'system':
      return undefined; // Use system locale defaults
    case 'US':
      return {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC'
      };
    case 'EU':
      return {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC'
      };
    case 'ISO':
      return {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC'
      };
    case 'short':
      return {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC'
      };
    case 'medium':
      return {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      };
    case 'long':
      return {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      };
    case 'full':
      return {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      };
    case 'EU-medium':
      return {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        timeZone: 'UTC'
      };
    default:
      return {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      };
  }
}

function getLocale(format) {
  switch (format) {
    case 'system':
      return undefined; // Use system locale
    case 'US':
      return 'en-US';
    case 'EU':
      return 'en-GB';
    default:
      return undefined;
  }
}

// Cache settings
let cachedSettings = null;

// Update settings cache
export function updateDateFormatSettings(settings) {
  cachedSettings = settings;
}

export function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    const format = cachedSettings?.dateFormat || 'system';
    
    console.log('Formatting date:', {
      input: dateString,
      format: format,
      settings: cachedSettings
    });
    
    const options = getDateFormatOptions(format);
    const locale = getLocale(format);
    
    let formatted = date.toLocaleDateString(locale, options);
    console.log('Initial format:', formatted);
    
    // Special handling for specific formats
    if (format === 'ISO') {
      formatted = date.toISOString().split('T')[0];
    } else if (format === 'EU' || format === 'EU-medium') {
      // Force DD/MM/YYYY or DD MMM YYYY format for EU
      const date = new Date(dateString);
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = format === 'EU-medium' 
        ? date.toLocaleDateString('en-GB', { month: 'short' })
        : String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      const separator = format === 'EU-medium' ? ' ' : '/';
      formatted = `${day}${separator}${month}${separator}${year}`;
      console.log('EU format applied:', formatted);
    }
    
    return formatted;
  } catch (error) {
    console.error('Failed to format date:', error);
    return dateString;
  }
}

export function formatPreview(entry) {
  let preview = '';
  
  if (entry.parsed.final_deadline) {
    preview += `<span class="deadline">Due: ${formatDate(entry.parsed.final_deadline)}</span>`;
  }
  
  if (entry.parsed.priority) {
    preview += `<span class="priority ${entry.parsed.priority}">Priority: ${entry.parsed.priority}</span>`;
  }
  
  if (entry.parsed.participants?.length) {
    preview += `<span class="participants">With: ${entry.parsed.participants.join(', ')}</span>`;
  }
  
  return preview;
}
