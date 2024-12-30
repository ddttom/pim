# PIM User Manual

## Interface Overview

### Main View

![Main Interface](images/main app screen.png)

The main view displays your entries in a table format with sortable columns:

- **Content**: First part of the entry text (hover to see full content)
- **Type**: Entry type (Note/Document/Template/HTML/Record/Task/Event)
- **Date**: Creation date of the entry
- **Project**: Associated project name
- **Priority**: Entry priority level (high/normal/low)
- **Tags**: Associated tags shown as pills
- **Deadline**: Due date if set

Click any column header to sort entries. Click again to reverse sort order.

### Sidebar Navigation

![Sidebar](images/sidebar showing on main.png)

The sidebar provides quick access to filtered views:

- **All Entries**: Show all entries
- **Overdue**: Show entries past their deadline
- **Priority**:
  - High Priority
  - Normal Priority
  - Low Priority
- **Type**:
  - Note: General text entries
  - Document: Formatted documents
  - Template: Reusable templates
  - HTML: HTML content
  - Record: Data records
  - Task: Action items or to-dos
  - Event: Calendar events or meetings
- **Categories**:
  - Projects: Show entries with projects
  - Tags: Show entries with tags
- **Status**:
  - Archived: Show archived entries

### Toolbar

- **New Entry**: Create a new document
- **Copy DB**: Copy database contents to clipboard
- **Settings**: Access application settings

### Search

The search bar at the top allows you to:

- Search across all fields (content, projects, tags, etc.)
- Clear search with the (×) button or Escape key
- See results update in real-time as you type

### Editor

The editor provides a full viewport workspace for creating and editing entries:

- **Back to List**: Return to the main view
- **Save**: Save your changes (with save icon)
- **Save As**: Save entry as a different type (appears below button)
- **Add Images**: Attach images to your entry
- **Test Parser**: Test entry parsing (appears below button)
- **Settings**: Configure application settings (appears below button)
- **Archive**: Move entry to archive (appears in archived view)

The entry type is shown as a colored badge in the editor toolbar. Use Save As to change an entry's type:

- Note (Green): General text entries
- Document (Blue): Formatted documents
- Template (Purple): Reusable templates
- HTML (Orange): HTML content
- Record (Brown): Structured data entries
- Task (Red): Action items or to-dos
- Event (Teal): Calendar events and meetings

The editor provides rich text formatting options:

- Headers (H1, H2, H3)
- Bold, italic, underline, strike-through
- Links and blockquotes
- Code blocks
- Ordered and unordered lists

### Modal System

The application uses a dynamic modal system:

- **Editor Modal**: Uses full viewport for maximum workspace
- **Settings Modal**: Appears below settings button with scrollable content
- **Save As Modal**: Appears below Save As button for type selection
- **Test Parser Modal**: Appears below Test Parser button with scrollable results
- **Confirmation Modals**: Centered on screen for important actions

All modals support:

- Escape key to close
- Click outside to dismiss
- Proper layering with z-index management
- Scrollbars for overflow content
- Keyboard focus management

### Keyboard Shortcuts

- `Ctrl+N`: New entry
- `Ctrl+S`: Save current entry
- `Ctrl+F`: Focus search
- `Ctrl+,`: Open settings
- `Ctrl+\`: Toggle sidebar
- `Esc`: Clear search (when search is focused)

### Settings

![Settings](images/settings modal.png)

Access settings through the gear icon to configure:

- Editor preferences
- Display options
- Theme customization
- Backup/restore options
- Keyboard shortcuts

## Tips & Tricks

- Use the sidebar filters to quickly find entries
- Sort columns to organize your view
- Use tags to categorize entries
- Hover over truncated content to see full text
- Use keyboard shortcuts for common actions
- Collapse the sidebar to maximize workspace
- Use Copy DB to backup or share your data
- Archive old entries to keep your main view clean
- Use appropriate entry types for better organization:
  - Notes for general text and thoughts
  - Documents for formatted content
  - Templates for reusable structures
  - HTML for web content
  - Records for structured data
  - Tasks for action items
  - Events for calendar entries

## Troubleshooting

If you encounter issues:

1. Check settings configuration
2. Ensure entries are saved properly
3. Verify search/filter combinations
4. Clear search and filters to reset view
5. Restart the application if needed
6. Contact support with error details

## Data Management

- Entries are saved automatically
- Regular backups recommended (use Copy DB)
- Use projects and tags for organization
- Sort and filter to manage large sets of entries
- Search across all fields to find specific entries
