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
- **Deadline**: Due date with status indicators:
  - Green: Future deadlines
  - Red: Overdue deadlines
  - Default color: No deadline set

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
- **Filters**: Toggle sidebar visibility
- **Settings**: Configure application settings (Ctrl+,)
- **Copy DB**: Copy database contents to clipboard

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

The application uses an optimized dynamic modal system that efficiently manages system resources:

Modal Types:
- **Editor Modal**: Full viewport workspace for document editing
- **Settings Modal**: Configuration interface with multiple sections
- **Save As Modal**: Type selection for document conversion
- **Test Parser Modal**: Parser testing with results display
- **Confirmation Modals**: Action confirmations and alerts

Performance Features:
- Dynamic creation and cleanup
- Memory optimization
- Efficient state management
- Resource cleanup on close
- Background process optimization

Interaction Behavior:
- Escape key closes and cleans up modal
- Click outside dismisses and removes modal
- Automatic focus management
- Proper modal stacking
- State preservation when needed

Accessibility Features:
- Focus trap within active modal
- Focus restoration on close
- Screen reader support
- Keyboard navigation
- ARIA label management

State Management:
- Preserves relevant settings
- Maintains modal history
- Syncs across components
- Validates state changes
- Cleans up on modal close

### Keyboard Shortcuts

- `Ctrl+N`: New entry
- `Ctrl+S`: Save current entry
- `Ctrl+F`: Focus search
- `Ctrl+,`: Open settings
- `Ctrl+\`: Toggle sidebar
- `Esc`: Clear search (when search is focused)

### Settings

![Settings](images/settings modal.png)

Access settings through the gear icon in the main toolbar. The settings panel is organized into three main sections:

#### Editor Settings
- Auto-save entries
- Spell check
- Font family
- Font size

#### User Interface Settings
- Theme selection (Light/Dark/System)
- Date format preferences:
  - System Default (uses your computer's locale)
  - US formats (MM/DD/YY, MMM DD, YYYY, etc.)
  - EU formats (DD/MM/YY, DD MMM YYYY, etc.)
  - ISO 8601 (YYYY-MM-DD)
  - Japanese (YYYY年MM月DD日)

#### Advanced Settings
- Cloud sync configuration
- Backup and restore options

The settings panel features:
- Copy Settings button to export current configuration
- Save button to apply changes
- Cancel button to discard changes
- Organized sections for better navigation

Visual Feedback:
- Button Actions:
  - Success state shown with green background color
  - Text updates to indicate completion:
    * "Copy Settings" → "Copied"
    * "Save" → "Saved"
  - Color transitions smoothly between states
  - Returns to original state after 2 seconds
  - Toast notifications confirm actions

Settings Actions:
- Save Changes:
  1. Click Save button
  2. Button transitions to green success state
  3. Text changes to "Saved"
  4. Toast notification confirms save
  5. Modal closes automatically

- Copy Settings:
  1. Click Copy Settings button
  2. Button transitions to green success state
  3. Text changes to "Copied"
  4. Toast notification confirms copy
  5. Settings copied to clipboard

- Cancel Changes:
  1. Click Cancel button
  2. Modal closes immediately
  3. Changes are discarded

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
