export function formatDate(dateString, format = 'system') {
  try {
    const date = new Date(dateString);
    
    // Get system locale
    const systemLocale = navigator.language;
    
    // Format options based on selected format
    switch (format) {
      case 'system':
        return date.toLocaleDateString();
      
      case 'us-short':
        return date.toLocaleDateString('en-US', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit'
        });
      
      case 'us-medium':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      
      case 'us-long':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      case 'eu-short':
        return date.toLocaleDateString('en-GB', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit'
        });
      
      case 'eu-medium':
        return date.toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      
      case 'eu-long':
        return date.toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      
      case 'iso':
        return date.toISOString().split('T')[0];
      
      case 'jp':
        return date.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          era: 'narrow'
        });
      
      default:
        // If format is not recognized, use system locale
        return date.toLocaleDateString(systemLocale);
    }
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
