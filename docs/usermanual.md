# PIM User Manual

## Interface Overview

PIM (Personal Information Manager) is a desktop application designed to help you efficiently manage your personal information through a rich text editing interface. The application prioritizes simplicity, performance, and user experience while maintaining a lightweight footprint.

### Main Interface

The main interface consists of several key components:

- **Toolbar**: Located at the top of the application, providing access to core actions:
  - New Entry button
  - Copy DB button
  - Settings button
  - Search bar for real-time filtering

- **Sidebar**: A collapsible panel on the left side for filtered views:
  - All Entries
  - Overdue items
  - Priority levels
  - Entry types
  - Categories
  - Status filters
  - Toggle with `Ctrl+\`

- **Entry List**: The central area displaying your entries in a table format with sortable columns:
  - Content (with hover preview)
  - Type (with color-coded badges)
  - Date
  - Project
  - Priority
  - Tags
  - Deadline
  - Click column headers to sort

- **Entry Preview**: View entry details by clicking on an entry:
  - Full content display
  - Creation/update timestamps
  - Organized metadata sections
  - Quick action buttons (Edit, Copy, Delete)
  - Color-coded type badges

- **Editor**: Access the rich text editor by:
  - Double-clicking an entry
  - Clicking the Edit button in preview
  - Creating a new entry with `Ctrl+N`

- **Status Bar**: Located at the bottom of the application, showing:
  - Current entry count
  - Filter status
  - Application version

### Calendar View

The Calendar view provides a visual representation of your entries:

- **View Modes**: Switch between Month, Week, and Day views
- **Navigation**: Use year and month dropdowns to navigate
- **Entry Previews**: View entries directly in calendar cells
- **Visual Indicators**: Highlights for today and selected dates
- **Entry Count**: Badges showing number of entries per day

### Rich Text Editor

The editor provides comprehensive formatting capabilities:

- **Text Formatting**:
  - Headers (H1, H2, H3)
  - Bold, italic, underline, strike-through
  - Lists (ordered and unordered)
  - Links and blockquotes
  - Images
  - Tables
  - Code blocks

- **Editor Features**:
  - Autosave functionality
  - Version history
  - Find/replace
  - Spell check
  - Word count
  - Print support
  - Copy/paste handling
  - Drag and drop support

### Entry Types

PIM supports multiple content types to organize your information:

- **Notes**: Free-form text entries
- **Documents**: Formatted long-form content
- **Templates**: Reusable structured content
- **HTML**: Web content with preview
- **Records**: Structured data entries
- **Tasks**: Actionable items with status
- **Events**: Calendar entries with dates

### Settings

Access settings with `Ctrl+,` to configure:

- Theme preferences (light/dark mode)
- Default entry type
- Calendar view options
- Startup behavior
- Backup settings
- Plugin configuration

## Tips & Tricks

- Use the sidebar filters to quickly find entries
- Sort columns to organize your view
- Use tags to categorize entries
- Hover over truncated content to see full text
- Use keyboard shortcuts for common actions
- Collapse the sidebar to maximize workspace
- Use Copy DB to backup or share your data
- Archive old entries to keep your main view clean

### Editor Tips

- Heading buttons skip empty lines for cleaner formatting
- Use the table grid's live preview to visualize table size
- Watch the size indicator when creating tables
- Smooth transitions help track table cell selection
- Use appropriate entry types for better organization:
  - Notes for general text and thoughts
  - Documents for formatted content
  - Templates for reusable structures
  - HTML for web content
  - Records for structured data
  - Tasks for action items
  - Events for calendar entries

### AI-Powered Parsing

PIM now includes AI-powered text parsing using Ollama:

- Automatically extracts metadata from your text entries
- Identifies actions, contacts, projects, dates, and more
- Recognizes locations, durations, and participants
- Detects priorities and tags from natural language
- Understands context and nuance better than traditional parsing

Examples of what the AI parser can understand:

- "Call John about Project Alpha next Monday at 2pm"
- "Meeting with Sarah in Conference Room B tomorrow for 1 hour"
- "Email the team about quarterly results by Friday #important"
- "Review documentation for the new API - 50% complete"
- "Lunch with clients at Bistro on Thursday at noon"

To use the AI parser:

1. Install Ollama from [ollama.ai/download](https://ollama.ai/download)
2. Start the Ollama service with `ollama serve`
3. Pull the required model with `ollama pull hhao/qwen2.5-coder-tools:32b`
4. Create or edit entries as usual - the AI parser will automatically extract metadata

For more details, see the [Ollama Parser Documentation](docs/ollama-parser.md).

## Keyboard Shortcuts

- `Ctrl+N`: New entry
- `Ctrl+S`: Save current entry
- `Ctrl+F`: Focus search
- `Ctrl+,`: Open settings
- `Ctrl+\`: Toggle sidebar
- `Esc`: Clear search (when search is focused)

## Troubleshooting

If you encounter issues:

1. Check settings configuration
2. Ensure entries are saved properly
3. Verify search/filter combinations
4. Clear search and filters to reset view
5. Restart the application if needed
6. Contact support with error details

### Ollama Parser Troubleshooting

If the AI parser is not working correctly:

1. Ensure Ollama is installed and running (`ollama serve`)
2. Check if the required model is available (`ollama list`)
3. Verify network connectivity to the Ollama service
4. Restart the application after starting Ollama
5. Check the application logs for specific error messages

## Data Management

- Entries are saved automatically
- Regular backups recommended (use Copy DB)
- Use projects and tags for organization
- Sort and filter to manage large sets of entries
- Search across all fields to find specific entries
- Let the AI parser automatically extract metadata from your text
