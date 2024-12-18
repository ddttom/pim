export function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
